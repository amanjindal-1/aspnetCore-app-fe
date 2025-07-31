
function UserSelector({ users, selectedUserId, onChange, label }: any) {
  return (
    <div>
      <label>{label}: </label>
      <select value={selectedUserId} onChange={e => onChange(Number(e.target.value))}>
        <option value={0} disabled>Select a user</option>
        {users.map((user: any) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </select>
    </div>
  );
}


export default UserSelector;