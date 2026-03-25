import LoginButton from '@/components/LoginButton'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-md text-center max-w-sm w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">배움일지</h1>
        <p className="text-gray-500 mb-8 text-sm">수업 후 오늘의 배움을 기록해요</p>
        <LoginButton />
      </div>
    </main>
  )
}
