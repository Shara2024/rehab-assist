// import { useAuth } from "@/contexts/AuthContext";
// import { useLogin } from "../hooks/useLogin";

// export default function LoginModule() {
//   const { state } = useAuth();
//   const { login } = useLogin();

//   return (
//     <div style={{ maxWidth: 420 }}>
//       <h2>Login</h2>

//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           const form = e.currentTarget;
//           const email = (form.elements.namedItem("email") as HTMLInputElement)
//             .value;
//           const password = (
//             form.elements.namedItem("password") as HTMLInputElement
//           ).value;
//           login(email, password);
//         }}
//         style={{ display: "grid", gap: 10 }}
//       >
//         <input name="email" defaultValue="patient@test.com" />
//         <input name="password" defaultValue="1234" type="password" />

//         <button disabled={state.isLoading}>
//           {state.isLoading ? "Logging in..." : "Login"}
//         </button>

//         {state.error && <div style={{ color: "red" }}>{state.error}</div>}
//       </form>
//     </div>
//   );
// }

import { LoginSide } from "@/features/auth/login/components/LoginSide";
import { LoginCard } from "@/features/auth/login/components/LoginCard";

export default function LoginModule() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[60%_40%]">
      <LoginSide />

      <div className="bg-muted/30 flex items-center justify-center p-6 md:p-10">
        <LoginCard />
      </div>
    </div>
  );
}
