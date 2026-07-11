import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { register } from "@/api/authApi";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register/")({ component: RegisterPage });
function message(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.message ?? "Không thể đăng ký" : "Không thể đăng ký"; }
function RegisterPage() {
  const nav = useNavigate(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setError(""); const f=new FormData(e.currentTarget); const password=String(f.get("password")); if(password!==f.get("confirm")){setError("Mật khẩu xác nhận không khớp");setBusy(false);return;} try { await register({fullName:String(f.get("fullName")),email:String(f.get("email")),password,role:f.get("role") as "FARMER"|"BUYER"}); await nav({to:"/login"}); } catch(err){setError(message(err));} finally{setBusy(false);} }
  return <AuthCard title="Tạo tài khoản" description="Đăng ký để giao dịch nông sản trên AgriConnect."><form onSubmit={submit} className="space-y-4">
    <Field label="Họ và tên" name="fullName" autoComplete="name" /><Field label="Email" name="email" type="email" autoComplete="email" />
    <div className="space-y-2"><Label htmlFor="role">Bạn là</Label><select id="role" name="role" className="h-11 w-full rounded-md border bg-background px-3"><option value="FARMER">Nông dân</option><option value="BUYER">Người mua</option></select></div>
    <Field label="Mật khẩu" name="password" type="password" minLength={8} autoComplete="new-password" /><Field label="Xác nhận mật khẩu" name="confirm" type="password" minLength={8} autoComplete="new-password" />
    {error&&<p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full">{busy?"Đang tạo...":"Đăng ký"}</Button>
    <p className="text-center text-sm text-muted-foreground">Đã có tài khoản? <Link to="/login" className="font-semibold text-primary">Đăng nhập</Link></p>
  </form></AuthCard>;
}
function Field(props: React.ComponentProps<typeof Input>&{label:string;name:string}) { const {label,...rest}=props; return <div className="space-y-2"><Label htmlFor={rest.name}>{label}</Label><Input id={rest.name} required {...rest}/></div>; }
