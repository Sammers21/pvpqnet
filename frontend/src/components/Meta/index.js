import PageHeader from "../AppBar";
import React from "react";
import Footer from "../Footer";
import Grid from "./Grid";

const Meta = ({}) => {
  document.title = `Meta`;
  return (<>
    <PageHeader/>
    <Grid></Grid>
    <Footer/>
  </>);
}

export default Meta;