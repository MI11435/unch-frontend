"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import "./NavigationProgress.css";

export default function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);
    const completeTimerRef = useRef(null);
    const prevPathRef = useRef(null);

    useEffect(() => {
        const currentPath = pathname + searchParams.toString();

        if (prevPathRef.current === null) {
            prevPathRef.current = currentPath;
            return;
        }

        if (prevPathRef.current === currentPath) return;
        prevPathRef.current = currentPath;

        clearTimeout(timerRef.current);
        clearTimeout(completeTimerRef.current);

        setProgress(0);
        setVisible(true);

        let p = 0;
        const tick = () => {
            if (p < 85) {
                p += Math.random() * 12 + 4;
                if (p > 85) p = 85;
                setProgress(p);
                timerRef.current = setTimeout(tick, 120 + Math.random() * 80);
            }
        };
        timerRef.current = setTimeout(tick, 60);

        completeTimerRef.current = setTimeout(() => {
            setProgress(100);
            setTimeout(() => setVisible(false), 300);
        }, 600);

        return () => {
            clearTimeout(timerRef.current);
            clearTimeout(completeTimerRef.current);
        };
    }, [pathname, searchParams]);

    if (!visible) return null;

    return (
        <div className="nav-progress-bar" style={{ width: `${progress}%` }} />
    );
}
