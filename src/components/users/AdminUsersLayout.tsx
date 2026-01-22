// AdminUsersLayout.tsx
import { Outlet } from "react-router-dom";
import { UserTabs } from "./UserTabs";

export default function AdminUsersLayout() {
  return (
    <>
      <UserTabs />
      <Outlet />
    </>
  );
}
