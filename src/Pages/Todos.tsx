import { useEffect, useRef, useState } from "react";
import API from "../API/api";
import { Todo } from "../Types/types";
import { useNavigate } from "react-router-dom";
import "../styles/Todos.css";
import { generateToken, messaging } from "../config/firebase";
import { onMessage } from "firebase/messaging";

interface User {
  _id: string;
  name: string;
  role: string;
}

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [groupedTodos, setGroupedTodos] = useState<Record<string, Todo[]>>({});
  const [usersInfo, setUsersInfo] = useState<Record<string, string>>({});
  const [newTodo, setNewTodo] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<{ total: number, page: number, limit: number, totalPages: number } | null>(null);

  const navigate = useNavigate();
  const loadTodosRef = useRef<() => Promise<void>>(async () => {});


  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => generateToken())
        .catch((err) => console.error("SW registration failed", err));
    }
  }, []);

  const loadTodos = async (pageNumber = page, pageLimit = limit) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  
    try {
      const { data: currentUser } = await API.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(currentUser);
  
      if (currentUser.role === "admin") {
        const { data: allUsers } = await API.get<User[]>("/auth/all-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const userDetails: Record<string, string> = {};
        allUsers.filter(u => u.role === "user").forEach(u => {
          userDetails[u._id] = u.name;
        });
        setUsersInfo(userDetails);
  
        let url = `/todos/all-todos?page=${pageNumber}&limit=${pageLimit}`;
        if (selectedUserId && selectedUserId !== "all") {
          url += `&userId=${selectedUserId}`;
        }
  
        const response = await API.get<{ data: Todo[] | Record<string, Todo[]>; meta: any }>(url, {headers: { Authorization: `Bearer ${token}` }});
        const { data: todosData, meta } = response.data;
  
        if (selectedUserId === "all") {
          setTodos(todosData as Todo[]);
        } else if (selectedUserId) {
          setTodos(todosData as Todo[]);
        } else {
          const grouped: Record<string, Todo[]> = {};
          Object.keys(userDetails).forEach(id => {
            grouped[id] = (todosData as Record<string, Todo[]>)[id] || [];
          });
          setGroupedTodos(grouped);
          setTodos([]);
        }
        setPage(meta.page);
        setLimit(meta.limit);
        setMeta(meta);
      } else {
        const response = await API.get<{ data: Todo[]; meta: any }>(`/todos?page=${pageNumber}&limit=${pageLimit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTodos(response.data.data);
        setPage(response.data.meta.page);
        setLimit(response.data.meta.limit);
        setMeta(response.data.meta);
      }
    } catch (err) {
      console.error("Error loading todos:", err);
    }
  };
  
loadTodosRef.current = loadTodos;


  useEffect(() => {
    loadTodos();
  }, [selectedUserId]);


  onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
  
    if (Notification.permission === "granted") {
      new Notification(payload.notification?.title || "New Notification", {
        body: payload.notification?.body || "You have a new message",
        icon: payload.notification?.icon || "/firebase-logo.png",
      });
    } 
     if (payload.data?.action === "reloadTodos") {
    loadTodosRef.current();  
  }
});

  const addTodo = async () => {
    if (!newTodo.trim() || user?.role === "admin") return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not authenticated. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const res = await API.post<Todo>( "/todos",{ description: newTodo }, { headers: { Authorization: `Bearer ${token}` } });
      setTodos([...todos, res.data]);
      setNewTodo("");
      await loadTodos(page, limit);
    } catch (err) {
      console.error("Error adding todo:", err);
      alert("Failed to add todo. Please try again.");
    }
  };

  const updateTodo = async (id: string, currentDescription: string) => {
    const newDescription = prompt("Update todo:", currentDescription);
    if (!newDescription?.trim()) return alert('Empty values are not accepted')

    const token = localStorage.getItem("token");
    if (!token) return;

    const endpoint = user?.role === "admin" ? `/todos/all-todos/${id}` : `/todos/${id}`;
    const { data } = await API.put(endpoint, { description: newDescription },
       { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadTodos(page, limit);


    if (user?.role === "admin") {
      setGroupedTodos((prev) => {
        const copy = { ...prev };
        for (const key in copy) {
          copy[key] = copy[key].map((t) =>
            t._id === id ? { ...t, description: data.description } : t
          );
        }
        return copy;
      });
    } else {
      setTodos(todos.map((t) => (t._id === id ? { ...t, description: data.description } : t)));
    }
  };
  

  const deleteTodo = async (id: string) => {
    if (!window.confirm("Delete this todo?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const endpoint = user?.role === "admin" ? `/todos/all-todos/${id}` : `/todos/${id}`;
    await API.delete(endpoint, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
     await loadTodos(page, limit);

    if (user?.role === "admin") {
      setGroupedTodos((prev) => {
        const copy = { ...prev };
        for (const key in copy) {
          copy[key] = copy[key].filter((t) => t._id !== id);
        }
        return copy;
      });
    } else {
      setTodos(todos.filter((t) => t._id !== id));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fcmToken");
    alert("Logout successfully");
    navigate("/login");
  };

  return (
    <div className="todo-container">
      <h2>{user?.role === "admin" ? "All Users Todos" : "My Todos"}</h2>

      <button className="logout-button" onClick={logout}>Logout</button>
      <br /><br />

      {user?.role !== "admin" && (
        <div>
          <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}  placeholder="Enter your todos..."/>
          <button className="add-button" onClick={addTodo}>Add</button>
        </div>
      )}

    {user?.role === "admin" && (
      <div>
        <select value={selectedUserId || ""} onChange={(e) => {setSelectedUserId(e.target.value);
          setPage(1)}} style={{ padding: "8px", width: "100%", marginBottom: "15px" }}>
          <option value="">-- Select User --</option>
          <option value="all">All Todos</option>
          {Object.keys(usersInfo).map((userId) => (
            <option key={userId} value={userId}>
              {usersInfo[userId]}
            </option>
          ))}
        </select>

        {selectedUserId ? (
          <div>
            {todos.length > 0 ? (
              <ul style={{ paddingLeft: "1px", marginTop: "1px" }}>
                {todos.map((todo) => (
                  <li key={todo._id} className="todo-item" style={{ padding: "2px 7px",marginBottom: "2px",borderRadius: "6px",border: "1px solid #ddd", display: "flex",alignItems: "center"}}>  
                    <span>{todo.description}</span>
                    <div>
                      <button className="update-button" onClick={() => updateTodo(todo._id, todo.description)}>Update</button>
                      <button className="delete-button" onClick={() => deleteTodo(todo._id)}>X</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#555", marginLeft: "10px" }}>There is no todo for this user.</p>
            )}
          </div>
        ) : (
          <p style={{ color: "#555", marginLeft: "10px" }}>Please select a user to view todos.</p>
        )}
      </div>
    )}

      {user?.role !== "admin" && (
        <ul>
          {todos.map((todo) => (
            <li key={todo._id}>
              <div className="todo-item">
                <span>{todo.description}</span>
                <div>
                  <button className="update-button" onClick={() => updateTodo(todo._id, todo.description)}>Update</button>
                  <button className="delete-button" onClick={() => deleteTodo(todo._id)}>X</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && (user?.role !== "admin" || (user?.role === "admin" && selectedUserId)) &&(
        <div style={{ marginTop: "20px", justifyContent: 'space-between', display: 'flex'}}>
          <button disabled={page <= 1} onClick={() => loadTodos(page - 1, limit)} style={{ marginRight: "5px" }}>Previous</button>

          <span style={{fontSize: '15px'}}>
            Page {meta.page} 
          </span>

          <button disabled={page >= meta.totalPages} onClick={() => loadTodos(page + 1, limit)} style={{ marginLeft: "5px" }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Todos;