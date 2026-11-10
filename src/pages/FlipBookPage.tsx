import { useEffect } from "react";
import FlipBook from "@/flipbook/FlipBook";

export default function FlipBookPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Flip Book · The Money Tree of Life";
    return () => {
      document.title = prev;
    };
  }, []);

  return <FlipBook />;
}
