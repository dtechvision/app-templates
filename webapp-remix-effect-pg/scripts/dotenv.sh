#!/bin/bash

# env-parser.sh
parse_env_file() {
    local file=$1
    local keys=()
    
    if [ -f "$file" ]; then
        # Read file line by line
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ $line =~ ^[[:space:]]*$ ]] || [[ $line =~ ^# ]]; then
                continue
            fi
            
            # Extract key using regex
            if [[ $line =~ ^([a-zA-Z_][a-zA-Z0-9_]*)= ]]; then
                keys+=("${BASH_REMATCH[1]}=")
            fi
        done < "$file"
    fi
    echo "${keys[@]}"
}

# Default filenames
ENV_FILE=".env"
ENV_EXAMPLE=".env.template"

# Override defaults if arguments provided
if [ ! -z "$1" ]; then
    ENV_FILE=$1
fi
if [ ! -z "$2" ]; then
    ENV_EXAMPLE=$2
fi

# Parse both files
env_keys=($(parse_env_file "$ENV_FILE"))
example_keys=($(parse_env_file "$ENV_EXAMPLE"))

# Find differences and append to .env.example
for key in "${env_keys[@]}"; do
    found=false
    for example_key in "${example_keys[@]}"; do
        if [ "$key" = "$example_key" ]; then
            found=true
            break
        fi
    done
    
    if [ "$found" = false ]; then
        echo "\n$key" >> "$ENV_EXAMPLE"
    fi
done
