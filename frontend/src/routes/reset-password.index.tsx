import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "@/api/authApi";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route=createFileRoute("/reset-password/")({validateSearch:(s:Record<string,unknown>)=>({token:typeof s.token==="string"?s.token:""}),component:Page});
function Page(){const{token}=Route.useSearch();const nav=useNavigate();const[error,setError]=useState("");async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget),p=String(f.get("password"));if(p!==f.get("confirm")){setError("Mật khẩu xác nhận không khớp");return}try{await resetPassword({token,newPassword:p});await nav({to:"/login"})}catch{setError("Liên kết không hợp lệ hoặc đã hết hạn")}}return <AuthCard title="Đặt lại mật khẩu" description="Liên kết có hiệu lực trong 30 phút và chỉ sử dụng một lần."><form onSubmit={submit} className="space-y-4">{["password","confirm"].map((n,i)=><div className="space-y-2" key={n}><Label htmlFor={n}>{i?"Xác nhận mật khẩu":"Mật khẩu mới"}</Label><Input id={n} name={n} type="password" minLength={8} required/></div>)}{error&&<p className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={!token}>Đặt lại mật khẩu</Button><Link to="/forgot-password" className="block text-center text-sm text-primary">Yêu cầu liên kết mới</Link></form></AuthCard>}
