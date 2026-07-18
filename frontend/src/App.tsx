import "./App.css"

export default function App({CustomComponent} : {CustomComponent : any}) {
  return (
    <>
      <div className="bg-background stars min-h-screen">
        <div className='min-h-screen px-4 py-8 flex items-center justify-center'>
          <CustomComponent/>
        </div>
      </div>

      
    </>
  )
}
