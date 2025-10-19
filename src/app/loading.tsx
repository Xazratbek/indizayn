export default function LoadingSpinner() {
  return (
    <div className="spinner">
      <div className="spinner-outer"></div>
      <div className="spinner-inner"></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
