let ret = [];
document.querySelectorAll(".jrLXZA").forEach((e) => {
  ret.push({
    id: ret.length + 1,
    name: e.querySelector(".dyNUfy").innerText,
    category: "TOP",
    imageUrl: e.querySelector("img").src,
    brand: e.querySelector(".hEPUWf").innerText,
    styleTags: "#스트릿 #오버핏",
    sourceUrl: e.querySelector(".dyNUfy").parentNode.href,
  });
});
console.log(JSON.stringify(ret));
