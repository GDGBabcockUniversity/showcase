import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { SubmitForm } from "./submit-form";
import { submitProject } from "./actions";

export const metadata: Metadata = {
  title: "Submit — GDG Babcock Showcase",
  description: "Put your project on the board. Every submission is reviewed.",
};

export default async function SubmitPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1&redirect=/submit");
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:py-14">
        <p className="eyebrow flex items-center gap-3 border-b border-border pb-6">
          <Dots />
          Submit a project
        </p>

        <div className="mt-8">
          <SubmitForm
            key={session.user.id}
            userId={session.user.id}
            action={submitProject}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
