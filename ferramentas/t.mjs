import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
const v=process.argv[2];
const t=new MsEdgeTTS();await t.setMetadata(v,OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
const r=await t.toFile(process.env.TEMP+"/vt","Oi, tudo bem?",{pitch:"+5%"});console.log(v,"OK");t.close();
