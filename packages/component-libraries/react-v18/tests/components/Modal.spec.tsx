import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Modal } from "../../src/components/Modal.js";

describe("Modal", () => {
  function renderModal(open: boolean, onClose = vi.fn()) {
    return render(
      <Modal open={open} onClose={onClose} aria-label="Example modal">
        <button type="button">First action</button>
        <button type="button">Second action</button>
      </Modal>
    );
  }

  it("renders dialog content when open", async () => {
    renderModal(true);

    const dialog = await screen.findByRole("dialog", { name: /example modal/i });
    expect(dialog).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal(false);

    expect(screen.queryByRole("dialog", { name: /example modal/i })).not.toBeInTheDocument();
  });

  it("invokes onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    const overlay = await screen.findByTestId("modal-overlay");
    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(overlay);
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    await screen.findByRole("dialog", { name: /example modal/i });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the dialog container when opened", async () => {
    renderModal(true);

    const dialog = await screen.findByRole("dialog", { name: /example modal/i });

    await waitFor(() => {
      expect(dialog).toHaveFocus();
    });
  });

  it("cycles focus within the modal when tabbing", async () => {
    renderModal(true);

    const firstButton = await screen.findByRole("button", { name: /first action/i });
    const secondButton = await screen.findByRole("button", { name: /second action/i });

    firstButton.focus();
    expect(firstButton).toHaveFocus();

    fireEvent.keyDown(firstButton, { key: "Tab" });
    await waitFor(() => {
      expect(secondButton).toHaveFocus();
    });

    fireEvent.keyDown(secondButton, { key: "Tab" });
    await waitFor(() => {
      expect(firstButton).toHaveFocus();
    });

    fireEvent.keyDown(firstButton, { key: "Tab", shiftKey: true });
    await waitFor(() => {
      expect(secondButton).toHaveFocus();
    });
  });
});
