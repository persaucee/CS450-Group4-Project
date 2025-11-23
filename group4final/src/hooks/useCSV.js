import { useState, useEffect } from "react";
import * as d3 from "d3";

export default function useCSV(path) {
  const [data, setData] = useState([]);

  useEffect(() => {
    d3.csv(path).then(setData);
  }, [path]);

  return data;
}
