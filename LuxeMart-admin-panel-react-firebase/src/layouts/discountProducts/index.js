// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import { CircularProgress, OutlinedInput, InputAdornment, IconButton, DialogActions, Dialog, DialogTitle, DialogContent, Typography, Box, TextField, InputLabel, FormControl, Select, MenuItem } from '@mui/material';
import { green } from "@mui/material/colors";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Icon from "@mui/material/Icon";
import * as React from 'react';

// Admin panel React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Admin panel React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Data
import banksNameTable from "layouts/discountProducts/data/banksNameTable";

// Firestore 
import { db, storage } from "../../firebase";
import { collection, addDoc, getDocs, doc, setDoc,getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Modal Styles
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
}

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

function Banks() {
  const { columns, rows } = banksNameTable();
  const [bankModal, setBankModal] = React.useState(false);
  const [bankNotification, setBankNotification] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [imageProgress, setImageProgress] = React.useState(0);
  const [imageProgressValue, setImageProgressValue] = React.useState(0);
  const [bankFile, setBankFile] = React.useState('');
  const [banksData, setBanksData] = React.useState({
    name: '',
    price: '',
    address: '',
    category: '',
    startDate: '',
    endDate: '',
    discount:'',
  });

  const [categoriesDropdown, setCategoriesDropdown] = React.useState([]);
  const [productsDropdown, setProductsDropdown] = React.useState([]);

  // Fetch all categories from Firestore
  const fetchAllCategories = async () => {
    try {
      const getAllDocs = await getDocs(collection(db, "categories"));
      const dbData = getAllDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategoriesDropdown(dbData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const getAllDocs = await getDocs(collection(db, "products"));
      const dbData = getAllDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductsDropdown(dbData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  React.useEffect(() => {
    fetchAllCategories();
    fetchAllProducts();
  }, []);

  // BankFile upload
  React.useEffect(() => {
    const uploadBankFile = () => {
      const name = bankFile.name;
      const storageRef = ref(storage, `discountproducts/${name}`);
      const uploadTask = uploadBytesResumable(storageRef, bankFile);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageProgress(progress);
          setImageProgressValue(progress);
        },
        (error) => {
          console.log("ERROR == ", error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setBanksData((prev) => ({
              ...prev,
              image: downloadURL,
            }));
          });
        }
      );
    };
    bankFile && uploadBankFile();
  }, [bankFile]);

  const onAddBank = async (e) => {
    e.preventDefault();
    // Post data into Firestore
    try {
      setLoading(true);
      const docId = await addDoc(collection(db, "discountproducts"), {
        name: banksData.name.toLowerCase().replace(/\s+/g, '').trim(),
        price: banksData.price,
        discount:banksData.discount,
        address: banksData.address,
        image: banksData.image,
        startDate: banksData.startDate,
        endDate: banksData.endDate,
        cards: []
      });
      const updateData = {
        uid: docId.id
      };
      const DocRef = doc(db, "discountproducts", docId.id);
      await setDoc(DocRef, updateData, { merge: true });
      bankModalClose();
      bankNotificationOpen();
      setBanksData({
        name: '',
        price: '',
        discount:'',
        address: '',
        category: '',
        startDate: '',
        endDate: '',
      });
      setImageProgress(0);
      setImageProgressValue(0);
    } catch (error) {
      setError(error.code);
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productName) => {
    try {
      const productDoc = await getDoc(doc(db, "products", productName));
      if (productDoc.exists()) {
        const productData = productDoc.data();
        setBanksData((prev) => ({
          ...prev,
          category: productData.category,
         
        }));
      } else {
        console.log("No such product!");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };
  
  const handleProductChange = (e) => {
    const productName = e.target.value;
    setBanksData((prev) => ({
      ...prev,
      name: productName,
    }));
    fetchProductDetails(productName);
  };
  
  

  const bankModalOpen = () => setBankModal(true);
  const bankModalClose = () => {
    setBankModal(false);
    setLoading(false);
    setError('');
    setImageProgress(0);
    setImageProgressValue(0);
  };
  const bankNotificationOpen = () => setBankNotification(true);
  const bankNotificationClose = () => setBankNotification(false);

  return (
    <>
      <MDSnackbar
        color="success"
        icon="check"
        title="Successfully Add"
        open={bankNotification}
        onClose={bankNotificationClose}
        close={bankNotificationClose}
      />
      <BootstrapDialog
        onClose={bankModalClose}
        aria-labelledby="customized-dialog-title"
        open={bankModal}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={bankModalClose}>
          <Typography variant="h3" color="secondary.main" sx={{ pt: 1, textAlign: "center" }}>Add Discount Product</Typography>
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            sx={{
              "& .MuiTextField-root": { m: 2, maxWidth: "100%", display: "flex", direction: "column", justifyContent: "center" },
            }}
            noValidate
            autoComplete="off"
          >
             <Box sx={{ maxWidth: "100%", m: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="product-select-label" sx={{ height: "2.8rem" }} required>Select Product</InputLabel>
                <Select
                  sx={{ height: "2.8rem" }}
                  labelId="product-select-label"
                  id="product-select"
                  label="Select Product"
                  value={banksData.name}
                  onChange={handleProductChange}
                >
                  {productsDropdown.map((item) => (
                    <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Current Price Rs."
              type="number"
              rows={1}
              color="secondary"
              required
              value={banksData.price}
              onChange={(e) => setBanksData({
                ...banksData,
                price: e.target.value
              })}
            />
             <TextField
              label="Discount Percentage %"
              type="number"
              rows={1}
              color="secondary"
              required
              value={banksData.discount}
              onChange={(e) => setBanksData({
                ...banksData,
                discount: e.target.value
              })}
            />
            {/* <TextField
             // label="Website URL"
              type="url"
              rows={1}
              color="secondary"
              required
              value={banksData.address}
              onChange={(e) => setBanksData({
                ...banksData,
                address: e.target.value
              })}
            /> */}
            <Box sx={{ maxWidth: "100%", m: 2 }}>
            <FormControl fullWidth>
  <InputLabel id="category-select-label" sx={{ height: "2.8rem" }} required>Select Category</InputLabel>
  <Select
    sx={{ height: "2.8rem" }}
    labelId="category-select-label"
    id="category-select"
    label="Select Category"
    value={banksData.category}
    onChange={(e) => setBanksData({
      ...banksData,
      category: e.target.value
    })}
  >
    {categoriesDropdown.map((item) => (
      <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>
    ))}
  </Select>
</FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel htmlFor="outlined-adornment-amount">Product Image</InputLabel>
                <OutlinedInput
                  sx={{ height: "2.8rem" }}
                  id="outlined-adornment-amount"
                  startAdornment={<><InputAdornment position="start">
                    <input multiple type="File"
                      onChange={(e) => setBankFile(e.target.files[0])}
                    />
                  </InputAdornment>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        size={25}
                        sx={{
                          color: green[500],
                        }}
                        value={imageProgress} />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {imageProgressValue === 100 ? <CheckIcon /> : null}
                      </Box>
                    </Box></>}
                  label="Product Image"
                />
              </FormControl>
            </Box>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              margin="normal"
              value={banksData.startDate}
              onChange={(e) => setBanksData({
                ...banksData,
                startDate: e.target.value
              })}
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              margin="normal"
              value={banksData.endDate}
              onChange={(e) => setBanksData({
                ...banksData,
                endDate: e.target.value
              })}
            />
            {error === '' ? null :
              <MDBox mb={2} p={1}>
                <TextField
                  error
                  id="standard-error"
                  label="Error"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      "& input": {
                        color: "red",
                      }
                    }
                  }}
                  value={error}
                  variant="standard"
                />
              </MDBox>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <MDButton variant="contained" color="error" onClick={bankModalClose}>
            Close
          </MDButton>
          {loading ?
            <CircularProgress
              size={30}
              sx={{
                color: green[500],
              }}
            /> : <MDButton variant="contained" color="info" type="submit"
              onClick={onAddBank}
            >Save</MDButton>
          }
        </DialogActions>
      </BootstrapDialog>

      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <MDBox>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <MDBox
                    mx={2}
                    mt={-3}
                    py={3}
                    px={2}
                    variant="gradient"
                    bgColor="info"
                    borderRadius="lg"
                    coloredShadow="info"
                  >
                    <MDBox pt={2} pb={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
                      <MDTypography variant="h6" fontWeight="medium" color="white">
                        All DISCOUNT PRODUCTS
                      </MDTypography>
                      <MDButton variant="gradient" color="light"
                        onClick={bankModalOpen}>
                        <Icon sx={{ fontWeight: "bold" }}>add</Icon>
                        &nbsp;ADD DISCOUNT PRODUCTS
                      </MDButton>
                    </MDBox>
                  </MDBox>
                  <MDBox pt={3}>
                    <DataTable
                      table={{ columns, rows }}
                      isSorted={false}
                      entriesPerPage={false}
                      showTotalEntries={false}
                      noEndBorder
                    />
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </MDBox>
        </MDBox>
        <Footer />
      </DashboardLayout>
    </>
  );
}

export default Banks;
