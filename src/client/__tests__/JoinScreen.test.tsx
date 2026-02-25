import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// Will import once Task 1 creates the component
// import { JoinScreen } from "../../components/JoinScreen";

describe("JoinScreen", () => {
  it.todo("renders name input field");
  it.todo("renders role selection (leader and follower)");
  it.todo("renders session code input with placeholder hint");
  it.todo("renders Glory branding with soar. tagline");
  it.todo("renders join button");
  it.todo("pre-fills name from localStorage");
  it.todo("shows error when submitting with empty name");
  it.todo("shows error when submitting with empty session code");
  it.todo("does not show error before first submit attempt");
  it.todo("calls onJoin with name, role, and code on valid submit");
  it.todo("saves name to localStorage on successful join");
  it.todo("defaults role to follower");
});
