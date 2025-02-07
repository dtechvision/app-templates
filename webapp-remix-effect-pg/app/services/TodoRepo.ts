import type { ParseError } from "@effect/schema/ParseResult";
import { SqlClient, type SqlError } from "@effect/sql";
import { Effect, Layer, Metric } from "effect";
import { Todo } from "~/types/Todo";

interface TodoRepoService {
  getAllTodos: Effect.Effect<
    ReadonlyArray<Todo.Encoded>,
    SqlError.SqlError | ParseError,
    never
  >;
  createTodo: (
    title: string,
  ) => Effect.Effect<
    ReadonlyArray<Todo.Encoded>,
    SqlError.SqlError | ParseError,
    never
  >;
  toggleTodo: (
    id: number,
  ) => Effect.Effect<
    ReadonlyArray<Todo.Encoded>,
    SqlError.SqlError | ParseError,
    never
  >;
  deleteTodo: (
    id: number,
  ) => Effect.Effect<
    ReadonlyArray<Todo.Encoded>,
    SqlError.SqlError | ParseError,
    never
  >;
}

const todoCounter = Metric.counter("todos_total", {
  description: "Total number of todos in the system",
});

const makeTodoRepo = Effect.gen(function* (_) {
  const sql = yield* SqlClient.SqlClient;

  const getAllTodos = Effect.gen(function* () {
    const todos = yield* sql<{
      id: number;
      title: string;
      status: "CREATED" | "COMPLETED";
      created_at: Date;
    }>`SELECT * FROM todos ORDER BY created_at DESC`.pipe(
      Effect.withSpan("getAllTodos.query"),
      Effect.tap(() =>
        Effect.annotateCurrentSpan("query", "SELECT * FROM todos"),
      ),
      Effect.tapError((e) => Effect.logError("Failed to fetch todos", e)),
    );

    return yield* Todo.encodeArray(
      todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        status: todo.status,
        createdAt: todo.created_at,
      })),
    ).pipe(
      Effect.withSpan("getAllTodos.encode"),
      Effect.tapError((e) => Effect.logError("Failed to encode todos", e)),
    );
  }).pipe(Effect.withSpan("TodoRepo.getAllTodos"));

  const createTodo = (title: string) =>
    Effect.gen(function* () {
      const _result = yield* sql<{
        id: number;
        title: string;
        status: "CREATED" | "COMPLETED";
        created_at: Date;
      }>`
        INSERT INTO todos (title, status)
        VALUES (${title}, 'CREATED')
        RETURNING *
      `.pipe(
        Effect.withSpan("createTodo.query"),
        Effect.tap(() => Effect.annotateCurrentSpan("title", title)),
        Effect.tapError((e) => Effect.logError("Failed to create todo", e)),
      );

      yield* todoCounter(Effect.succeed(1)); // increment counter

      return yield* getAllTodos;
    }).pipe(Effect.withSpan("TodoRepo.createTodo"));

  const toggleTodo = (id: number) =>
    Effect.gen(function* () {
      yield* sql`
        UPDATE todos 
        SET status = CASE 
          WHEN status = 'COMPLETED' THEN 'CREATED' 
          ELSE 'COMPLETED' 
        END
        WHERE id = ${id}
      `;

      return yield* getAllTodos;
    }).pipe(Effect.withSpan("TodoRepo.toggleTodo"));

  const deleteTodo = (id: number) =>
    Effect.gen(function* () {
      yield* sql`DELETE FROM todos WHERE id = ${id}`;
      yield* todoCounter(Effect.succeed(-1)); // decrement counter
      return yield* getAllTodos;
    }).pipe(Effect.withSpan("TodoRepo.deleteTodo"));

  return {
    getAllTodos,
    createTodo,
    toggleTodo,
    deleteTodo,
  } satisfies TodoRepoService;
});

export class TodoRepo extends Effect.Tag("@services/TodoRepo")<
  TodoRepo,
  TodoRepoService
>() {
  static Live = Layer.effect(this, makeTodoRepo);
}
