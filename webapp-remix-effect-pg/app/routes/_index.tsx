import type { MetaFunction } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import type { Todo } from "../types/Todo";

import "todomvc-app-css/index.css";
import "todomvc-common/base.css";

import { Effect } from "effect";
import { TodoRepo } from "~/services/TodoRepo";
import { loaderFunction } from "~/services/index";

export const meta: MetaFunction = () => {
  return [
    { title: "Remixing Effect" },
    {
      name: "description",
      content: "Integrate Effect & Remix for the greater good!",
    },
  ];
};

export const TodoRow = ({ todo }: { todo: Todo.Encoded }) => {
  const isCompleted = todo.status === "COMPLETED";
  const fetcher = useFetcher();

  return (
    <li className={isCompleted ? "completed" : ""} key={todo.id}>
      <div className="view">
        <fetcher.Form method="post">
          <input type="hidden" name="id" value={todo.id} />
          <input
            className="toggle"
            type="checkbox"
            checked={isCompleted}
            onChange={() =>
              fetcher.submit({ id: todo.id.toString() }, { method: "post" })
            }
            id={`todo-${todo.id}`}
          />
        </fetcher.Form>
        <label htmlFor={`todo-${todo.id}`}>{todo.title}</label>
        <button
          className="destroy"
          type="button"
          onClick={() =>
            fetcher.submit(
              { id: todo.id.toString(), _action: "delete" },
              { method: "post" },
            )
          }
        />
      </div>
    </li>
  );
};

export const AddTodoForm = () => {
  return (
    <form method="post" action="?index">
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        name="title"
        required
      />
    </form>
  );
};

export const loader = loaderFunction(() => TodoRepo.getAllTodos);

export const action = loaderFunction(({ request }: ActionFunctionArgs) =>
  Effect.gen(function* (_) {
    const formData = yield* Effect.promise(() => request.formData());

    if (request.method === "POST") {
      const title = formData.get("title");
      const id = formData.get("id");
      const actionType = formData.get("_action");

      if (title) {
        return yield* TodoRepo.createTodo(title as string);
      }

      if (id) {
        if (actionType === "delete") {
          return yield* TodoRepo.deleteTodo(Number(id));
        }
        return yield* TodoRepo.toggleTodo(Number(id));
      }
    }
    return yield* TodoRepo.getAllTodos;
  }),
);

export default function Index() {
  const todos = useLoaderData<typeof loader>();

  return (
    <section className="todoapp">
      <header className="header">
        <h1>todos...</h1>
        <AddTodoForm />
      </header>
      <section className="main">
        <input id="toggle-all" className="toggle-all" type="checkbox" />
        <label htmlFor="toggle-all">Mark all as complete</label>
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoRow todo={todo} key={todo.id} />
          ))}
        </ul>
      </section>
    </section>
  );
}
