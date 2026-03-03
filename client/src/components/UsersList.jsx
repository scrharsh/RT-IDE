export function UsersList({ users }) {
  return (
    <div className="panel">
      <h3>Active users ({users.length})</h3>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
