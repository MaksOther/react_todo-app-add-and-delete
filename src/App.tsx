import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { UserWarning } from './UserWarning';
import { getTodos, addTodo, deleteTodo, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [title, setTitle] = useState<string>('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingTodoIds, setDeletingTodoIds] = useState<number[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredTodos = todos.filter(todo => {
    if (filterStatus === 'active') {
      return !todo.completed;
    }

    if (filterStatus === 'completed') {
      return todo.completed;
    }

    return true;
  });

  useEffect(() => {
    setErrorMessage('');

    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => clearTimeout(timerId);
  }, [errorMessage]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');
      return;
    }

    setLoading(true);

    const tempTodoItem: Todo = {
      userId: USER_ID,
      id: 0,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(tempTodoItem);

    addTodo(trimmedTitle)
      .then(newTodo => {
        setTodos(prevTodos => [...prevTodos, newTodo]);
        setTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        setLoading(false);
      });
  };

  const handleDeletePost = (id: number) => {
    setDeletingTodoIds(currentIds => [...currentIds, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
        inputRef.current?.focus();
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setDeletingTodoIds(currentIds =>
          currentIds.filter(todoId => todoId !== id),
        );
      });
  };

  const handleClearCompleted = () => {
    todos.forEach(todo => {
      if (todo.completed) {
        handleDeletePost(todo.id);
      }
    });
  };

  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const isAllCompleted = todos.length > 0 && activeTodosCount === 0;
  const hasCompletedTodos = todos.some(todo => todo.completed);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={classNames('todoapp__toggle-all', {
              active: isAllCompleted,
            })}
            data-cy="ToggleAllButton"
            aria-label="Toggle all todos"
          />

          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={loading}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <>
            <TodoList
              todos={filteredTodos}
              tempTodo={tempTodo}
              deletingTodoIds={deletingTodoIds}
              onDelete={handleDeletePost}
            />

            <Footer
              activeCount={activeTodosCount}
              filterStatus={filterStatus}
              hasCompletedTodos={hasCompletedTodos}
              onFilterChange={setFilterStatus}
              onClearCompleted={handleClearCompleted}
            />
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          aria-label="Hide error"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
