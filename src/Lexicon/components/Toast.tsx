import { useState, useEffect, useCallback, useRef } from 'react';

export interface ToastMessage {
  id: number;
  tag: string;
  word: string;
  brief: string;
}

interface ToastProps {
  queue: ToastMessage[];
  onDone: (id: number) => void;
}

export default function Toast({ queue, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showNext = useCallback(() => {
    if (queue.length === 0) return;
    const msg = queue[0];
    setCurrent(msg);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onDone(msg.id);
      }, 250);
    }, 1800);
  }, [queue, onDone]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      showNext();
    }
  }, [queue, current, showNext]);

  useEffect(() => {
    if (!visible && current) {
      const t = setTimeout(() => {
        setCurrent(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible, current]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!current) return null;

  return (
    <div className={`lex-toast ${visible ? 'lex-toast--show' : ''}`}>
      <div className="lex-toast__tag">{current.tag}</div>
      <div className="lex-toast__word">{current.word}</div>
      <div className="lex-toast__brief">{current.brief}</div>
    </div>
  );
}
