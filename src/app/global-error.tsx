"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main style={{fontFamily:"Urbanist, sans-serif",minHeight:"100vh",display:"grid",placeItems:"center",background:"#f8faf8",padding:24}}><section style={{maxWidth:520,textAlign:"center",background:"white",border:"1px solid #e2e7e3",borderRadius:16,padding:32}}><h1>CandidRoute needs to reload.</h1><p style={{color:"#68756d"}}>No saved information was changed.</p><button onClick={reset} style={{border:0,borderRadius:8,background:"#17211b",color:"white",padding:"10px 14px",fontWeight:700}}>Reload workspace</button></section></main></body></html>;
}
