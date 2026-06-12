import { useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered"
  },
  args: {
    closeOnOverlayClick: true
  }
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Basic: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          aria-label="Basic modal"
        >
          <h2 className="modal__title">Team invite</h2>
          <p>Send an invitation email to collaborate on this project.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input aria-label="Email" placeholder="person@example.com" type="email" />
            <textarea
              aria-label="Message"
              placeholder="Add a message (optional)"
              style={{
                width: "100%",
                minHeight: "96px",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--surface)"
              }}
            />
          </div>
          <div className="modal__footer">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Send invite</Button>
          </div>
        </Modal>
      </div>
    );
  }
};

export const WithInitialFocus: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          initialFocusRef={primaryButtonRef}
          aria-label="Modal with initial focus"
        >
          <h2 className="modal__title">Delete document</h2>
          <p>This action cannot be undone. Are you sure you want to continue?</p>
          <div className="modal__footer">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button ref={primaryButtonRef} variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    );
  }
};
