import Link from "next/link";

import { Brand } from "./site-components";

export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <div>
        <span className="eyebrow">404</span>
        <h1>Nothing outstanding here.</h1>
        <p>The page you were looking for doesn’t exist or has moved.</p>
        <Link className="nav-cta" href="/">
          Back to Owwed
        </Link>
      </div>
    </main>
  );
}
