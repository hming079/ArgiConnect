import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { changePassword } from "@/api/authApi";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route=createFileRoute("/change-password/")({component:Page});
function Page(){const[error,setError]=useState("");const[done,setDone]=useState(false);const[busy,setBusy]=useState(false);async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError("");const form=e.currentTarget;const f=new FormData(form),next=String(f.get("newPassword"));if(next!==f.get("confirm")){setError("Mật khẩu xác nhận không khớp");return}setBusy(true);try{await changePassword({currentPassword:String(f.get("currentPassword")),newPassword:next});setDone(true);form.reset()}catch(err){setError(axios.isAxiosError(err)?err.response?.data?.message??"Không thể đổi mật khẩu":"Không thể đổi mật khẩu")}finally{setBusy(false)}}return <AuthCard title="Đổi mật khẩu" description="Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới."><form onSubmit={submit} className="space-y-4">{[["currentPassword","Mật khẩu hiện tại"],["newPassword","Mật khẩu mới"],["confirm","Xác nhận mật khẩu mới"]].map(([name,label])=><div className="space-y-2" key={name}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type="password" minLength={8} required/></div>)}{error&&<p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{done&&<p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">Đổi mật khẩu thành công.</p>}<Button disabled={busy} className="w-full">{busy?"Đang lưu...":"Đổi mật khẩu"}</Button><Link to="/" className="block text-center text-sm text-primary">Về trang chủ</Link></form></AuthCard>}
