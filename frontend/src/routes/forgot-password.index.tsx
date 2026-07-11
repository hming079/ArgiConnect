import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { forgotPassword } from "@/api/authApi";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route=createFileRoute("/forgot-password/")({component:Page});
function Page(){const[email,setEmail]=useState("");const[busy,setBusy]=useState(false);const[token,setToken]=useState<string|null|undefined>();async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);try{const r=await forgotPassword({email});setToken(r.resetToken);}finally{setBusy(false)}}return <AuthCard title="Quên mật khẩu" description="Nhập email tài khoản để tạo liên kết đặt lại mật khẩu."><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><Button disabled={busy} className="w-full">{busy?"Đang xử lý...":"Tiếp tục"}</Button>{token!==undefined&&<div className="rounded-xl bg-primary/10 p-3 text-sm">Nếu email tồn tại, yêu cầu đã được tạo. {token&&<Link to="/reset-password" search={{token}} className="mt-2 block font-semibold text-primary">Đặt lại mật khẩu</Link>}</div>}<Link to="/login" className="block text-center text-sm text-primary">Quay lại đăng nhập</Link></form></AuthCard>}
