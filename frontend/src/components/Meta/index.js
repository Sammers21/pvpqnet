import Header from "../Header";
import React from "react";
import Footer from "../Footer";
import Grid from "./Grid";

const Meta = () => {
  document.title = `Meta`;
  return (<>
    <Header/>
    <Grid/>
    <Footer/>
  </>);
}

export default Meta;