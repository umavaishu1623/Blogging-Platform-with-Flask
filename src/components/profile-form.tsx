"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";

type ProfileFormProps = { name: string; bio: string; website: string };

export function ProfileForm({ name, bio, website }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, {});
  return (
    <form action={formAction} className="profile-form">
      <label htmlFor="profile-name">Name</label><input autoComplete="name" defaultValue={name} id="profile-name" maxLength={60} minLength={2} name="name" required />
      <label htmlFor="profile-bio">About you</label><textarea defaultValue={bio} id="profile-bio" maxLength={500} name="bio" rows={5} />
      <label htmlFor="profile-website">Website</label><input defaultValue={website} id="profile-website" name="website" placeholder="https://example.com" type="url" />
      <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>
      <button className="button" disabled={pending} type="submit">{pending ? "Saving..." : "Save profile"}</button>
    </form>
  );
}