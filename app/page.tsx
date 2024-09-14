"use client";

import Main from "@/components/Main";
import { ToastProvider } from "@/components/Toast";

export default function App() {
  return (
    <ToastProvider>
      <Main />
    </ToastProvider>
  )
}
