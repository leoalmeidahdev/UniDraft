"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, type ComponentProps, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends ComponentProps<typeof Link> {
  icon?: ElementType;
  /** Estilo de item de lista (menu mobile) em vez de item de barra (nav desktop). */
  block?: boolean;
}

/** Link de navegação que sinaliza a rota ativa comparando com o pathname atual. */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink(
    { href, icon: Icon, block = false, className, children, ...props },
    ref
  ) {
    const pathname = usePathname();
    const hrefStr = href.toString();
    const isActive =
      hrefStr === "/" ? pathname === "/" : pathname.startsWith(hrefStr);

    return (
      <Link
        ref={ref}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground",
          block
            ? "w-full rounded-md px-1.5 py-1.5 text-sm"
            : "rounded-md px-2 py-1.5 text-sm",
          isActive && "text-primary hover:text-primary",
          className
        )}
        {...props}
      >
        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
        {children}
      </Link>
    );
  }
);
