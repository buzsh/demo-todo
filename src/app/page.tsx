"use client";

import { TodoItem } from "@/components/TodoItem";
import { nanoid } from "nanoid";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Todo } from "../types/todo";
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
  useCopilotChat,
} from "@copilotkit/react-core";
import { CopilotPopup, CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

declare global {
  interface Window {
    webkit: {
      messageHandlers: {
        copilotMessageProcessed: {
          postMessage: (message: string) => void;
        };
        copilotSidebarHidden: {
          postMessage: (message: string) => void;
        };
        copilotPopupHidden: {
          postMessage: (message: string) => void;
        };
      };
    };
    sendMessageToCopilot: (message: string) => void;
    showCopilotSidebar: () => void;
    hideCopilotSidebar: () => void;
    showCopilotPopup: () => void;
    hideCopilotPopup: () => void;
  }
}

const EmptyInput: React.FC = () => null;
const EmptyButton: React.FC = () => null;

export default function Home() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [showSidebar, setShowSidebar] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const showCopilotSidebar = () => {
    setShowSidebar(true);
  };

  const hideCopilotSidebar = () => {
    setShowSidebar(false);
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.copilotSidebarHidden) {
      window.webkit.messageHandlers.copilotSidebarHidden.postMessage("Copilot sidebar is hidden");
    } else {
      console.warn("Message handler 'copilotSidebarHidden' is not available.");
    }
  };

  const showCopilotPopup = () => {
    setShowPopup(true);
  };

  const hideCopilotPopup = () => {
    setShowPopup(false);
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.copilotPopupHidden) {
      window.webkit.messageHandlers.copilotPopupHidden.postMessage("Copilot popup is hidden");
    } else {
      console.warn("Message handler 'copilotPopupHidden' is not available.");
    }
  };

  useEffect(() => {
    window.showCopilotSidebar = showCopilotSidebar;
    window.hideCopilotSidebar = hideCopilotSidebar;
    window.showCopilotPopup = showCopilotPopup;
    window.hideCopilotPopup = hideCopilotPopup;
  }, []);

  return (
    <div className="rounded-md max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold ">Reminders</h1>
      <h2 className="text-base font-base mb-4">{today}</h2>

      <CopilotKit runtimeUrl="/api/copilotkit">
        <TodoList />

        {showPopup && (
          <CopilotPopup
            instructions={
              "Help the user manage a todo list. If the user provides a high level goal, " +
              "break it down into a few specific tasks and add them to the list"
            }
            defaultOpen={true}
            labels={{
              title: "Vessium",
              initial: "Hi there! 👋 I can help you manage your reminders.",
            }}
            clickOutsideToClose={true}
            showResponseButton={false}
            onSetOpen={(open) => {
              if (!open) {
                hideCopilotPopup();
              }
            }}
            Button={EmptyButton}
            Input={EmptyInput}
          />
        )}

        {showSidebar && (
          <CopilotSidebar
            instructions={
              "Help the user manage a todo list. If the user provides a high level goal, " +
              "break it down into a few specific tasks and add them to the list"
            }
            defaultOpen={true}
            labels={{
              title: "Vessium",
              initial: "Hi there! 👋 I can help you manage your reminders.",
            }}
            clickOutsideToClose={true}
            showResponseButton={false}
            onSetOpen={(open) => {
              if (!open) {
                hideCopilotSidebar();
              }
            }}
            Button={EmptyButton}
            Input={EmptyInput}
          />
        )}
        
      </CopilotKit>
    </div>
  );
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  useCopilotReadable({
    description: "The user's todo list.",
    value: todos,
  });

  useCopilotAction({
    name: "updateTodoList",
    description: "Update the users todo list",
    parameters: [
      {
        name: "items",
        type: "object[]",
        description: "The new and updated todo list items.",
        attributes: [
          {
            name: "id",
            type: "string",
            description: "The id of the todo item. When creating a new todo item, just make up a new id.",
          },
          {
            name: "text",
            type: "string",
            description: "The text of the todo item.",
          },
          {
            name: "isCompleted",
            type: "boolean",
            description: "The completion status of the todo item.",
          },
          {
            name: "assignedTo",
            type: "string",
            description: "The person assigned to the todo item. If you don't know, assign it to 'YOU'.",
            required: true,
          },
        ],
      },
    ],
    handler: ({ items }) => {
      const newTodos = [...todos];
      for (const item of items) {
        const existingItemIndex = newTodos.findIndex((todo) => todo.id === item.id);
        if (existingItemIndex !== -1) {
          newTodos[existingItemIndex] = item;
        } else {
          newTodos.push(item);
        }
      }
      setTodos(newTodos);
    },
    render: "Updating the todo list...",
  });

  useCopilotAction({
    name: "deleteTodo",
    description: "Delete a todo item",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The id of the todo item to delete.",
      },
    ],
    handler: ({ id }) => {
      setTodos(todos.filter((todo) => todo.id !== id));
    },
    render: "Deleting a todo item...",
  });

  const { append } = useCopilotChat({
    id: "todoListChat",
  });

  const sendMessageToCopilot = useCallback((message: string) => {
    append({ id: nanoid(), content: message, role: "user" })
      .then(() => {
        console.log("Message processed by CopilotKit");
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.copilotMessageProcessed) {
          window.webkit.messageHandlers.copilotMessageProcessed.postMessage("Message processed by CopilotKit");
        } else {
          console.warn("Message handler 'copilotMessageProcessed' is not available.");
        }
      });
  }, [append]);
  

  useEffect(() => {
    window.sendMessageToCopilot = sendMessageToCopilot;
  }, [sendMessageToCopilot]);

  const addTodo = () => {
    if (input.trim() !== "") {
      const newTodo: Todo = {
        id: nanoid(),
        text: input.trim(),
        isCompleted: false,
      };
      setTodos([...todos, newTodo]);
      setInput("");
      sendMessageToCopilot("A new todo item was added to the list.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const assignPerson = (id: string, person: string | null) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, assignedTo: person ? person : undefined } : todo
      )
    );
  };

  return (
    <div>
      <div className="flex mb-4">
        <input
          className="border rounded-md p-2 flex-1 mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className="bg-black rounded-md p-2 text-white" onClick={addTodo}>
          Add Reminder
        </button>
      </div>
      {todos.length > 0 && (
        <div className="border rounded-lg">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              toggleComplete={toggleComplete}
              deleteTodo={deleteTodo}
              assignPerson={assignPerson}
              hasBorder={index !== todos.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
