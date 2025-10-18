@keyframes spinner-rotate {
  0% { transform: rotateY(0deg) rotateX(0deg); }
  50% { transform: rotateY(180deg) rotateX(180deg); }
  100% { transform: rotateY(360deg) rotateX(360deg); }
}

@keyframes spinner-inner-rotate {
  0% { transform: rotateY(0deg) rotateX(0deg); }
  50% { transform: rotateY(-180deg) rotateX(-180deg); }
  100% { transform: rotateY(-360deg) rotateX(-360deg); }
}

.spinner {
  width: 64px;
  height: 64px;
  perspective: 150px;
}

.spinner-outer, .spinner-inner {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.spinner-outer {
  border: 4px solid hsl(var(--primary));
  border-left-color: transparent;
  border-right-color: transparent;
  animation: spinner-rotate 2s cubic-bezier(0.7, 0, 0.3, 1) infinite;
}

.spinner-inner {
  border: 4px solid hsl(var(--accent));
  border-top-color: transparent;
  border-bottom-color: transparent;
  animation: spinner-inner-rotate 2s cubic-bezier(0.7, 0, 0.3, 1) infinite;
  animation-delay: -0.5s;
}

export default function Loading() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="spinner">
        <div className="spinner-outer"></div>
        <div className="spinner-inner"></div>
      </div>
    </div>
  );
}
