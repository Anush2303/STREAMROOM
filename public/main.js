const form = document.querySelector("form");
const submit= document.querySelector(".submit");
let password= document.querySelector("#pass");
submit.addEventListener("click",perform);
function perform(e){
   
    if(form[0].value===""||form[1].value===""){
        e.preventDefault();
         Ui.add();
    }
}
class Ui{
    static add(){
        let newelement=document.createElement("span");
        newelement.innerHTML=`<h6>Please fill in both the fields</h6>`;
        form.appendChild(newelement);
        setTimeout(function(){newelement.remove();},2000);
    }
    static visible(){
    if(password.type==="password"){
        password.type="text";
    }
    else{
        password.type="password";
    }
    }
}

form.addEventListener("click",doit);
function doit(e){
    if(e.target.classList.contains("fa-eye")&&form[1].value!=""){
        Ui.visible();
    }
}