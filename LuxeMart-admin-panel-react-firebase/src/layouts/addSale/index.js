import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { db, storage } from '../../firebase';
import { collection, doc, addDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AuthContext } from 'context/AuthContext';
import {
  Box, CircularProgress, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, MenuItem, Select, Typography,
  OutlinedInput, InputAdornment, IconButton, styled, Icon, Grid, Card
} from '@mui/material';
import { green } from '@mui/material/colors';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import DataTable from 'examples/Tables/DataTable';
import Footer from 'examples/Footer';
import MDSnackbar from 'components/MDSnackbar';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import salesNameTable from 'layouts/addSale/data/SalesNameTable';

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

function AddSale() {
  const { columns, rows } = salesNameTable();
  const { currentUser, role } = useContext(AuthContext);
  const [brandsSaleModal, setBrandsModal] = useState(false);
  const [brandsSaleNotification, setBrandsSaleNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [posterImageProgress, setPosterImageProgress] = useState(0);
  const [posterImageProgressValue, setPosterImageProgressValue] = useState(0);
  const [bannerImageProgress, setBannerImageProgress] = useState(0);
  const [bannerImageProgressValue, setBannerImageProgressValue] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brandsDropdown, setBrandsDropdown] = useState([]);
  const [brandDbData, setBrandDbData] = useState({});
  const [posterFile, setPosterFile] = useState('');
  const [bannerFile, setBannerFile] = useState('');
  const [brandsSaleData, setBrandsSaleData] = useState({
    title: '',
    percentage: '',
    startDate: '',
    endDate: '',
    saleURL: '',
    location: ''
  });

  useEffect(() => {
    const uploadPosterFile = () => {
      const name = posterFile.name;
      const storageRef = ref(storage, `sales/${name}`);
      const uploadTask = uploadBytesResumable(storageRef, posterFile);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPosterImageProgress(progress);
          setPosterImageProgressValue(progress);
        },
        (error) => {
          console.log("ERROR == ", error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setBrandsSaleData((prev) => ({
              ...prev,
              poster: downloadURL
            }));
          });
        }
      );
    };
    if (posterFile) uploadPosterFile();
  }, [posterFile]);

  useEffect(() => {
    const uploadBannerFile = () => {
      const name = bannerFile.name;
      const storageRef = ref(storage, `sales/${name}`);
      const uploadTask = uploadBytesResumable(storageRef, bannerFile);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setBannerImageProgress(progress);
          setBannerImageProgressValue(progress);
        },
        (error) => {
          console.log("ERROR == ", error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setBrandsSaleData((prev) => ({
              ...prev,
              banner: downloadURL
            }));
          });
        }
      );
    };
    if (bannerFile) uploadBannerFile();
  }, [bannerFile]);

  const fetchAllBrands = async (selectedBrand) => {
    try {
      // Fetch all brands from Firestore
      const getAllDocs = await getDocs(collection(db, "brands"));
      const dbData = getAllDocs.docs.map((items) => ({ id: items.id, ...items.data() }));

      // Map the data to the required format
      const allBrands = dbData.map((filterItems) => ({
        id: filterItems.id,
        name: filterItems.name,
      }));

      // Set brands to the dropdown state
      setBrandsDropdown(allBrands);

      // Log the selectedBrand value for debugging
      console.log('Selected Brand ID:', selectedBrand);

      // Check if selectedBrand is valid before fetching specific brand data
      if (selectedBrand) {
        const brandDocRef = doc(db, "brands", selectedBrand);
        const getSpecificBrands = await getDoc(brandDocRef);

        if (getSpecificBrands.exists()) {
          setBrandDbData(getSpecificBrands.data());
        } else {
          console.log("No such document!");
        }
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  useEffect(() => {
    if (role === "admin" && selectedBrand) {
      fetchAllBrands(selectedBrand);
    }
  }, [selectedBrand, role]);

  const fetchAllBrands2 = async () => {
    const q = query(collection(db, "users"), where("uid", "==", currentUser));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      setSelectedBrand(doc.data().brandName);
    });

    if (selectedBrand) {
      fetchAllBrands(selectedBrand);
    }
  };

  useEffect(() => {
    if (role === "brand") {
      fetchAllBrands2();
    }
  }, [role]);

  const onAddBrandSale = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await addDoc(collection(db, "sales"), {
        ...brandsSaleData,
        brandId: selectedBrand,
        createdAt: new Date(),
        createdBy: currentUser.uid
      });
      setBrandsSaleNotification(true);
      setLoading(false);
      setBrandsModal(false);
      setBrandsSaleData({
        title: '',
        percentage: '',
        startDate: '',
        endDate: '',
        saleURL: '',
        location: ''
      });
    } catch (error) {
      setLoading(false);
      setError("Failed to add sale. Please try again.");
    }
  };

  const brandsSaleModalOpen = () => setBrandsModal(true);
  const brandsSaleModalClose = () => setBrandsModal(false);
  const brandsSaleNotificationClose = () => setBrandsSaleNotification(false);

  const handlePoster = (e) => {
    const file = e.target.files[0];
    setPosterFile(file);
  };

  const handleBanner = (e) => {
    const file = e.target.files[0];
    setBannerFile(file);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
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
                <Typography variant="h6" color="white">
                  All Sales
                </Typography>
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
      <Footer />

      <BootstrapDialog
        onClose={brandsSaleModalClose}
        aria-labelledby="customized-dialog-title"
        open={brandsSaleModal}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={brandsSaleModalClose}>
          Add Sale
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Box component="form" role="form" onSubmit={onAddBrandSale}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="brand-label">Brand</InputLabel>
                  <Select
                    labelId="brand-label"
                    id="brand"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    label="Brand"
                  >
                    {brandsDropdown.map((brand) => (
                      <MenuItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Title"
                  value={brandsSaleData.title}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Percentage"
                  value={brandsSaleData.percentage}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, percentage: e.target.value })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Start Date"
                  type="date"
                  value={brandsSaleData.startDate}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, startDate: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="End Date"
                  type="date"
                  value={brandsSaleData.endDate}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, endDate: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Sale URL"
                  value={brandsSaleData.saleURL}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, saleURL: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Location"
                  value={brandsSaleData.location}
                  onChange={(e) => setBrandsSaleData({ ...brandsSaleData, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="poster">Poster Image</InputLabel>
                  <OutlinedInput
                    id="poster"
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    onChange={handlePoster}
                    endAdornment={
                      posterImageProgress > 0 && (
                        <InputAdornment position="end">
                          <CircularProgress
                            variant="determinate"
                            value={posterImageProgressValue}
                            size={24}
                            thickness={4}
                            color="secondary"
                          />
                        </InputAdornment>
                      )
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="banner">Banner Image</InputLabel>
                  <OutlinedInput
                    id="banner"
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    onChange={handleBanner}
                    endAdornment={
                      bannerImageProgress > 0 && (
                        <InputAdornment position="end">
                          <CircularProgress
                            variant="determinate"
                            value={bannerImageProgressValue}
                            size={24}
                            thickness={4}
                            color="secondary"
                          />
                        </InputAdornment>
                      )
                    }
                  />
                </FormControl>
              </Grid>
            </Grid>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
            <Box mt={3} display="flex" justifyContent="flex-end">
              <MDButton
                color="error"
                onClick={brandsSaleModalClose}
                style={{ marginRight: 16 }}
                disabled={loading}
              >
                Cancel
              </MDButton>
              <MDButton
                type="submit"
                color="info"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CheckIcon />}
              >
                {loading ? "Saving..." : "Save"}
              </MDButton>
            </Box>
          </Box>
        </DialogContent>
      </BootstrapDialog>

      <MDSnackbar
        color="success"
        icon="check"
        title="Sale Added"
        content="Sale has been successfully added."
        open={brandsSaleNotification}
        onClose={brandsSaleNotificationClose}
        close={brandsSaleNotificationClose}
        bgWhite
      />
    </DashboardLayout>
  );
}

export default AddSale;
