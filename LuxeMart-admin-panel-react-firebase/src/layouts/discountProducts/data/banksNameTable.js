import React from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDButton from "components/MDButton";
import { db } from "../../../firebase";

function Data() {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    const fetchData = onSnapshot(
      collection(db, "discountproducts"),
      (snapshot) => {
        const bankList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(bankList);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => fetchData();
  }, []);

  const SR_NO = ({ srNo }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDBox ml={2} lineHeight={1}>
        <MDTypography variant="body2" fontWeight="small">
          {srNo}
        </MDTypography>
      </MDBox>
    </MDBox>
  );

  const BANK_NAME = ({ name, image }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image} name={name} size="sm" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
          {name}
        </MDTypography>
      </MDBox>
    </MDBox>
  );

  return {
    columns: [
      { Header: "SR NO#", accessor: "srNo", width: '10%', align: "left" },
      { Header: "Name", accessor: "discountproducts", align: "left" },
      { Header: "Action", accessor: "action", width: '10%', align: "right" }
    ],
    rows: data.map((item, index) => ({
      srNo: <SR_NO srNo={index + 1} />,
      discountproducts: <BANK_NAME image={item.image} name={item.name} />,
      action: (
        <Link to={`/admin/discountproducts/detail/${item.id}`}>
          <MDButton variant="gradient" color="info" size="small">
            Detail
          </MDButton>
        </Link>
      )
    }))
  };
}

export default Data;
