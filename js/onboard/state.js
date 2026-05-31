/* ---------- STATE ---------- */
const state={
  screen:(function(){var n=parseInt(localStorage.getItem("benu_screen")||"0",10);return isNaN(n)?0:Math.min(Math.max(n,0),9);})(),
  import:{files:[],link:"ssfreshnoodle.com",logo:null},
  build:{sel:{home:true,qr:true,catering:false,ordering:false},areas:{dining:8,patio:4,bar:6},homepage:{started:"",known:"",story:"",awards:""}},
  gen:{active:0,done:false},
  review:{states:{},vals:{},editing:null,editVal:""},
  photos:{uploaded:false,showMissing:false},
  catering:{confirmed:{},fields:{}},
  loc:{sameAs:{dom:false,rr:true}},
  tpl:{chosen:"editorial",focus:null},
  publish:{checks:{},published:false},
  allergy:{items:null},
};
function initState(){
  FINDING_GROUPS.forEach(function(g){g.items.forEach(function(it,i){var k=g.id+i;state.review.states[k]=null;state.review.vals[k]=it.to;});});
  CATERING.forEach(function(c){state.catering.fields[c.id]={serves:c.serves,price:c.price,lead:c.lead,min:c.min};});
  CHECKLIST.forEach(function(c){state.publish.checks[c.id]=c.done;});
  state.allergy.items=JSON.parse(JSON.stringify(ALLERGY_ITEMS));
}
function setModel(path,val){var parts=path.split(".");var o=state;for(var i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts[parts.length-1]]=val;}
