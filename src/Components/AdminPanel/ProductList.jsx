import React, { useState, useEffect } from "react";
import { Pagination } from "react-bootstrap";
import "./AdminPanel.css";
import { Box, Upload, Eye, PencilLine, Trash2, X } from "lucide-react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import axios from "axios";
import baseurl from "../ApiService/ApiService";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(baseurl + "/api/getAllProducts");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleViewDetails = (product) => {
    navigate(`productViewDetails/${product.pid}`);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setExistingImages(
      product.images.map((img, index) => ({
        id: index,
        image_path: img.image_path,
      }))
    );
    setIsModalOpen(true);
    setError("");
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (confirmed) {
      try {
        await axios.delete(`${baseurl}/api/deleteProductById/${product.pid}`);
        alert("Product deleted successfully");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleDeleteImage = async (imageIndex) => {
    setExistingImages(
      existingImages.filter((_, index) => index !== imageIndex)
    );
  };

  const handleSubmit = async () => {
    setError("");
    const formData = new FormData();

    // Add all product fields except images
    Object.entries(currentProduct || {}).forEach(([key, value]) => {
      if (key !== "images") {
        formData.append(key, value);
      }
    });

    // Handle images based on whether it's an update or new product
    if (currentProduct?.pid) {
      // Update case
      // Add new images if any
      Array.from(imageFiles).forEach((file) => {
        formData.append("images", file);
      });

      // Add existing images
      if (existingImages.length > 0) {
        formData.append(
          "existingImages",
          JSON.stringify(existingImages.map((img) => img.image_path))
        );
      }

      // Validate that at least one image exists (either new or existing)
      if (imageFiles.length === 0 && existingImages.length === 0) {
        setError("Please upload at least one image file.");
        return;
      }
    } else {
      // New product case
      // Validate that at least one new image is uploaded
      if (imageFiles.length === 0) {
        setError("Please upload at least one image file.");
        return;
      }

      // Add new images
      Array.from(imageFiles).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const url = currentProduct?.pid
        ? `${baseurl}/api/updateproduct/${currentProduct.pid}`
        : `${baseurl}/api/addProduct`;

      const response = await axios({
        method: currentProduct?.pid ? "put" : "post",
        url,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      fetchProducts();
      setImageFiles([]);
      setExistingImages([]);
      setError("");
      alert(response.data.message);
      toggleModal();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.errors) {
        setError(error.response.data.errors[0].msg);
      } else {
        setError("Failed to save product");
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
    setError("");
  };

  const removeNewImage = (index) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleModal = (product = null) => {
    setCurrentProduct(product);
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setImageFiles([]);
      setExistingImages([]);
      setError("");
    }
  };

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <div className="searches row align-items-center gx-3 mt-3">
        {/* Search Input */}
        <div className="col-12 col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search Product"
              id="productSearchBox"
            />
            {/* <button className="btn btn-outline-secondary" type="button">
              <i className="bi bi-search" style={{ color: "#808080" }}></i>
            </button> */}
          </div>
        </div>

        {/* Add Product Button */}
        <div className="col-12 col-md-4 mt-3 mt-md-0">
          <button
            id="addProductBtn"
            className="btn w-50 d-flex align-items-center justify-content-center"
            onClick={() => toggleModal()}
          >
            <i className="bi bi-plus-circle me-2"></i> Add Product
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="container-fluid p-0 mt-5">
        <div className="row">
          <div className="col-12">
            <div className="table-responsive">
              <div className="shadow-sm rounded bg-white">
                <table className="table table-striped table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4">S.No</th>
                      <th className="py-3 px-4">Product_ID</th>
                      <th className="py-3 px-4">Product_name</th>
                      <th className="py-3 px-4">MRP Rate</th>
                      <th className="py-3 px-4">Technicians Rate</th>
                      <th className="py-3 px-4">Distributors Rate</th>
                      <th className="py-3 px-4">Organization Name</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4">
                          {indexOfFirstProduct + index + 1}
                        </td>
                        <td className="py-3 px-4">{product.product_id}</td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary rounded p-1">
                              <Box color="white" size={20} />
                            </div>
                            <span className="text-nowrap">
                              {product.product_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.mrp_rate}</td>
                        <td className="py-3 px-4">
                          {product.technicians_rate || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {product.distributors_rate}
                        </td>
                        <td className="py-3 px-4">
                          {product.organization_name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-link p-0"
                              onClick={() => handleViewDetails(product)}
                            >
                              <Eye size={20} className="text-primary" />
                            </button>
                            <button
                              className="btn btn-link p-0"
                              onClick={() => handleEditProduct(product)}
                            >
                              <PencilLine size={20} className="text-info" />
                            </button>
                            <button
                              className="btn btn-link p-0"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 size={20} className="text-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="productPagination container d-flex mt-2"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="results-count text-center mb-3">
          Showing {currentProducts.length === 0 ? "0" : indexOfFirstProduct + 1}{" "}
          to {Math.min(indexOfLastProduct, products.length)} of{" "}
          {products.length} entries
        </div>

        <Pagination className="justify-content-center" style={{ gap: "10px" }}>
          <Pagination.Prev
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <MdChevronLeft />
          </Pagination.Prev>

          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={currentPage === index + 1}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}

          <Pagination.Next
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <MdChevronRight />
          </Pagination.Next>
        </Pagination>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div
            className="modal-content w-75 mt-5 pt-5"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#ffffff", height: "90vh" }}
          >
            <div className="d-flex justify-content-between"><h2>{currentProduct?.pid ? "Edit Product" : "Add Product"}</h2>
            <button
                  type="button"
                  className="btn-close"
                  onClick={toggleModal}
                ></button></div>
            {error && (
              <div
                className="error-message"
                style={{ color: "red", marginBottom: "10px" }}
              >
                {error}
              </div>
            )}
            <form className="productPopupForm">
              <div
                className="container d-flex flex-column "
                style={{ gap: "50px" }}
              >
                <div className="add-product-form" style={{ gap: "50px" }}>
                  <div className="">
                    <div>
                      <label>Product Name</label>
                      <input
                        type="text"
                        name="product_name"
                        placeholder="Enter product name"
                        value={currentProduct?.product_name || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>MRP Rate</label>
                      <input
                        type="number"
                        name="mrp_rate"
                        value={currentProduct?.mrp_rate || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Technicians Rate</label>
                      <input
                        type="number"
                        name="technicians_rate"
                        value={currentProduct?.technicians_rate || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Distributors Rate</label>
                      <input
                        type="number"
                        name="distributors_rate"
                        value={currentProduct?.distributors_rate || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Brand Name</label>
                      <input
                        type="text"
                        name="brand_name"
                        value={currentProduct?.brand_name || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Organization Name</label>
                      <input
                        type="text"
                        name="organization_name"
                        value={currentProduct?.organization_name || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="">
                    <div>
                      <label>Product Description</label>
                      <textarea
                        rows="3"
                        name="product_description"
                        value={currentProduct?.product_description || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Stocks</label>
                      <input
                        type="number"
                        name="stocks"
                        value={currentProduct?.stocks || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>How to Use</label>
                      <textarea
                        rows="2"
                        name="how_to_use"
                        value={currentProduct?.how_to_use || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Composition</label>
                      <input
                        type="text"
                        name="composition"
                        value={currentProduct?.composition || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Item Details</label>
                      <textarea
                        rows="2"
                        name="item_details"
                        value={currentProduct?.item_details || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="d-flex"
                  style={{
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <label>Upload Images</label>
                  <div className="image-upload-section">
                    {/* Existing Images */}
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className="image-preview">
                        <img
                          src={`${baseurl}/${image.image_path}`}
                          alt={`Existing ${index}`}
                        />
                        <button
                          type="button"
                          className="delete-image"
                          onClick={() => handleDeleteImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    {/* New Images */}
                    {imageFiles.map((file, index) => (
                      <div key={`new-${index}`} className="image-preview">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index}`}
                        />
                        <button
                          type="button"
                          className="delete-image"
                          onClick={() => removeNewImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Upload Button */}
                    <label className="upload-box">
                      <input
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                      <span className="upload-icon">
                        <Upload />
                      </span>
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSubmit}
                >
                  {currentProduct?.pid ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;
