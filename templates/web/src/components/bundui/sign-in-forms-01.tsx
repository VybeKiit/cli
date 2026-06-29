"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import Link from "next/link";

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
});

export default function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center">
          <img src="/logo.svg" className="size-10" alt="" />
        </div>

        {/* Heading */}
        <h1 className="font-heading text-center text-3xl">Sign in to your account</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex justify-between">
                    Password{" "}
                    <Link href="#" className="text-muted-foreground text-sm underline">
                      Forgot password?
                    </Link>
                  </FormLabel>

                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Form>

        <p className="text-muted-foreground text-sm">
          Not a member?{" "}
          <Link href="#" className="underline">
            Start a 14 day free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
