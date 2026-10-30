import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { gsap, motionReduced } from "./motion/gsap";
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const context = gsap.context(() => {
      if (!motionReduced(false)) gsap.fromTo(dialog.querySelector(".dialog-body"),
        { y: 12, rotationX: 4, transformPerspective: 900, opacity: .9 },
        { y: 0, rotationX: 0, opacity: 1, duration: .4, ease: "power3.out", clearProps: "transform,opacity" });
    });
    return () => {
      context.revert();
      dialog.close();
      prior?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-body">
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button close-dialog"
            aria-label="ปิดหน้าต่าง"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
