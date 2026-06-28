import type * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export interface ModalProps { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: React.ReactNode; }
export function Modal({ open, onOpenChange, title, description, children }: ModalProps) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-slate-700 bg-slate-950 text-slate-100"><DialogHeader><DialogTitle>{title}</DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}</DialogHeader>{children}</DialogContent></Dialog>; }
