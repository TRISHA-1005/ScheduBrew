import Image from "next/image";
import Link from "next/link";
import s from "./schedu.module.css";

export function Brand() {
  return (
    <Link href="/" className={s.brand} aria-label="ScheduBrew homepage">
      <Image src="/schedu/logo.png" alt="TRC The Ready Counter ScheduBrew" width={273} height={65} priority />
    </Link>
  );
}
