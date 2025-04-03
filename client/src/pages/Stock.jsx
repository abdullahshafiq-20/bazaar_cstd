import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useStore } from "../context/StoreContext"; // Add this import

function Stock() {
  const { currentStoreId } = useStore(); // Get the current store ID
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("add");
  const [stockForm, setStockForm] = useState({
    product_id: "",
    quantity: "",
    unit_price: "",
    notes: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentStoreId) {
      fetchData();
    } else {
      setError("Please select a store to manage stock");
      setLoading(false);
    }
  }, [currentStoreId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentStoreId) {
        setError("No store selected");
        setLoading(false);
        return;
      }

      // Get products
      const productsRes = await api.get("/product/get");
      setProducts(productsRes.data);

      // Get movements with proper structure handling
      const movementsRes = await api.get(
        `/stores/${currentStoreId}/stock/movements`
      );
      console.log("Stock movements response:", movementsRes.data); // Log to see the structure

      // Handle different response structures - extract the array of movements
      if (movementsRes.data && Array.isArray(movementsRes.data)) {
        // If the response is already an array
        setStockMovements(movementsRes.data);
      } else if (
        movementsRes.data &&
        movementsRes.data.success &&
        Array.isArray(movementsRes.data.data)
      ) {
        // If the response has a success/data structure with data as an array
        setStockMovements(movementsRes.data.data);
      } else if (
        movementsRes.data &&
        movementsRes.data.movements &&
        Array.isArray(movementsRes.data.movements)
      ) {
        // If the response has a movements property that is an array
        setStockMovements(movementsRes.data.movements);
      } else {
        // If we can't find an array, set an empty array and show an error
        console.error("Unexpected response format:", movementsRes.data);
        setStockMovements([]);
        setError("Received an unexpected data format from the server.");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load stock data. Please try again.");
      setStockMovements([]);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentStoreId) {
      alert("Please select a store first");
      return;
    }

    try {
      let endpoint;
      switch (activeTab) {
        case "add":
          endpoint = `/stores/${currentStoreId}/stock/add`;
          break;
        case "sale":
          endpoint = `/stores/${currentStoreId}/stock/sale`;
          break;
        case "remove":
          endpoint = `/stores/${currentStoreId}/stock/remove`;
          break;
        default:
          return;
      }

      // Transform field names to match what the API expects
      const payload = {
        product_id: stockForm.product_id,
        quantity: parseInt(stockForm.quantity, 10),
        unit_price: stockForm.unit_price
          ? parseFloat(stockForm.unit_price)
          : undefined,
        notes: stockForm.notes,
      };

      await api.post(endpoint, payload);
      setStockForm({
        product_id: "",
        quantity: "",
        unit_price: "",
        notes: "",
      });
      fetchData(); // Refresh data after successful submission
    } catch (error) {
      console.error(`Error recording ${activeTab}:`, error);
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getMovementTypeClass = (type) => {
    switch (type) {
      case "STOCK_IN":
        return "bg-green-100 text-green-800";
      case "SALE":
        return "bg-blue-100 text-blue-800";
      case "MANUAL_REMOVAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
        <button
          onClick={() => fetchData()}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Stock Management
      </h1>

      {!currentStoreId ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Please select a store to manage stock</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("add")}
                    className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                      activeTab === "add"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Add Stock
                  </button>
                  <button
                    onClick={() => setActiveTab("sale")}
                    className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                      activeTab === "sale"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Record Sale
                  </button>
                  <button
                    onClick={() => setActiveTab("remove")}
                    className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                      activeTab === "remove"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Remove Stock
                  </button>
                </nav>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {activeTab === "add" && "Add Stock"}
                  {activeTab === "sale" && "Record Sale"}
                  {activeTab === "remove" && "Remove Stock"}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="product_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Product
                    </label>
                    <select
                      id="product_id"
                      name="product_id"
                      value={stockForm.product_id}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option
                          key={product.product_id}
                          value={product.product_id}
                        >
                          {product.name} (SKU: {product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={stockForm.quantity}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {activeTab !== "remove" && (
                    <div className="mb-4">
                      <label
                        htmlFor="unit_price"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Unit Price{" "}
                        {activeTab === "add"
                          ? "(purchase price)"
                          : "(selling price)"}
                      </label>
                      <input
                        type="number"
                        id="unit_price"
                        name="unit_price"
                        value={stockForm.unit_price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Leave blank to use product price"
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={stockForm.notes}
                      onChange={handleInputChange}
                      rows="2"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={!currentStoreId}
                  >
                    {activeTab === "add" && "Add Stock"}
                    {activeTab === "sale" && "Record Sale"}
                    {activeTab === "remove" && "Remove Stock"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Stock Movements
                </h3>
                <span className="text-sm text-gray-500">
                  Store #{currentStoreId}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                  <p className="mt-2 text-gray-600">
                    Loading stock movements...
                  </p>
                </div>
              ) : stockMovements.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No stock movements found for this store.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(stockMovements) ? (
                        stockMovements.map((movement) => (
                          <tr
                            key={
                              movement.movement_id ||
                              `movement-${Math.random()}`
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {movement.product_name ||
                                movement.product?.name ||
                                "Unknown Product"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeClass(
                                  movement.movement_type
                                )}`}
                              >
                                {movement.movement_type === "STOCK_IN"
                                  ? "STOCK IN"
                                  : movement.movement_type === "MANUAL_REMOVAL"
                                  ? "REMOVAL"
                                  : movement.movement_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {movement.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {movement.unit_price
                                ? `$${parseFloat(movement.unit_price).toFixed(
                                    2
                                  )}`
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {movement.created_at
                                ? formatDate(movement.created_at)
                                : "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            Error processing movement data. Please try
                            refreshing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;
