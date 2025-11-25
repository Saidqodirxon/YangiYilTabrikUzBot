import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getCertificates,
  addCertificate,
  updateCertificate,
  generateCertificate,
  uploadFont,
} from "../utils/api";
import axios from "axios";

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPreview, setAutoPreview] = useState(true);
  const [uploadedFont, setUploadedFont] = useState(null);

  // URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get("userId");
  const firstNameFromUrl = urlParams.get("firstName");

  const [formData, setFormData] = useState({
    templateNumber: "",
    name: "",
    image: null,
    font: null,
    width: "",
    height: "",
    textConfig: {
      fontSize: 48,
      fontColor: "#000000",
      x: 0,
      y: 0,
      align: "center",
      maxWidth: 800,
      fontPath: null,
      fontFamily: "Arial",
    },
  });

  useEffect(() => {
    fetchCertificates();
    // Auto-fill name if coming from Congrats page
    if (firstNameFromUrl) {
      setPreviewText(decodeURIComponent(firstNameFromUrl));
    }
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await getCertificates();
      if (response.data.success) {
        setCertificates(response.data.data);
      }
    } catch (error) {
      console.error("Certificates xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const handleFontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, font: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.templateNumber || !formData.name || !formData.image) {
      alert("❌ Barcha maydonlarni to'ldiring va rasm yuklang!");
      return;
    }

    const data = new FormData();
    data.append("image", formData.image);
    if (formData.font) {
      data.append("font", formData.font);
    }
    data.append("templateNumber", formData.templateNumber);
    data.append("name", formData.name);
    if (formData.width) data.append("width", formData.width);
    if (formData.height) data.append("height", formData.height);
    data.append("textConfig", JSON.stringify(formData.textConfig));

    try {
      const response = await addCertificate(data);
      if (response.data.success) {
        alert("✅ " + response.data.message);
        setShowModal(false);
        setFormData({
          templateNumber: "",
          name: "",
          image: null,
          font: null,
          width: "",
          height: "",
          textConfig: {
            fontSize: 48,
            fontColor: "#000000",
            x: 0,
            y: 0,
            align: "center",
            maxWidth: 800,
            fontPath: null,
            fontFamily: "Arial",
          },
        });
        fetchCertificates();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEditTextConfig = (template) => {
    setSelectedTemplate(template);
    const newFormData = {
      ...formData,
      textConfig: template.textConfig || formData.textConfig,
    };
    setFormData(newFormData);
    setPreviewText(template.name || "Test matn");
    setGeneratedImage(null);
    setShowEditModal(true);
  };

  const handleUpdateTextConfig = async () => {
    try {
      const updateData = {
        textConfig: formData.textConfig,
      };

      if (formData.width) updateData.width = parseInt(formData.width);
      if (formData.height) updateData.height = parseInt(formData.height);

      const response = await updateCertificate(
        selectedTemplate._id,
        updateData
      );
      if (response.data.success) {
        alert("✅ " + response.data.message);
        setShowEditModal(false);
        fetchCertificates();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setGeneratedImage(null);
    setShowPreviewModal(true);
  };

  const handleGenerate = async (autoRun = false) => {
    if (!previewText) {
      if (!autoRun) alert("❌ Matn kiriting!");
      return;
    }

    setIsGenerating(true);
    try {
      // First update the certificate with new config if in edit mode
      if (showEditModal) {
        await updateCertificate(selectedTemplate._id, {
          textConfig: formData.textConfig,
        });
      }

      const response = await generateCertificate({
        templateId: selectedTemplate._id,
        text: previewText,
      });

      if (response.data.success) {
        setGeneratedImage(
          "http://localhost:3000" + response.data.imageUrl + "?t=" + Date.now()
        );
        if (!autoRun) alert("✅ " + response.data.message);
      }
    } catch (error) {
      if (!autoRun)
        alert(
          "❌ Xatolik: " + (error.response?.data?.message || error.message)
        );
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-regenerate on config change
  useEffect(() => {
    if (showEditModal && autoPreview && selectedTemplate && previewText) {
      const timer = setTimeout(() => {
        handleGenerate(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.textConfig, showEditModal, autoPreview, previewText]);

  const handleDelete = async (cert) => {
    if (!window.confirm(`"${cert.name}" template o'chirilsinmi?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/certificates/${cert._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Template o'chirildi");
      fetchCertificates();
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>🎨 Rasmi tabriknomalar</h1>
          <p>Rasm shablonlarini boshqarish</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Template qo'shish
        </button>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : certificates.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎨</span>
          <h2>Template'lar yo'q</h2>
          <p>Birinchi template'ni qo'shing</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Nomi</th>
                <th>O'lcham</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert._id}>
                  <td>
                    <strong>#{cert.templateNumber}</strong>
                  </td>
                  <td>{cert.name}</td>
                  <td>
                    {cert.width} x {cert.height} px
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        cert.isActive ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {cert.isActive ? "🟢 Faol" : "🔴 Nofaol"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEditTextConfig(cert)}
                      style={{ marginRight: "5px" }}
                    >
                      ⚙️ Sozlash
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePreview(cert)}
                      style={{ marginRight: "5px" }}
                    >
                      👁️ Preview
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(cert)}
                    >
                      🗑️ O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Yangi Template</h2>
              <button className="close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Template Raqami *</label>
                  <input
                    type="number"
                    value={formData.templateNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        templateNumber: e.target.value,
                      })
                    }
                    placeholder="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nomi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Yangi yil"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rasm Yuklash *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  <small>Rasm ustiga matn yoziladi</small>
                </div>

                <div className="form-group">
                  <label>Font Yuklash (TTF/OTF)</label>
                  <input
                    type="file"
                    accept=".ttf,.otf"
                    onChange={handleFontChange}
                  />
                  <small>Maxsus font ishlatish uchun (ixtiyoriy)</small>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>Kenglik (px)</label>
                    <input
                      type="number"
                      value={formData.width}
                      onChange={(e) =>
                        setFormData({ ...formData, width: e.target.value })
                      }
                      placeholder="Auto"
                    />
                    <small>Bo'sh qoldiring - avtomatik</small>
                  </div>

                  <div className="form-group">
                    <label>Balandlik (px)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      placeholder="Auto"
                    />
                    <small>Bo'sh qoldiring - avtomatik</small>
                  </div>
                </div>

                <h3
                  style={{
                    marginTop: "20px",
                    marginBottom: "10px",
                    fontSize: "16px",
                  }}
                >
                  Matn Sozlamalari
                </h3>

                <div className="form-group">
                  <label>Font O'lchami (px)</label>
                  <input
                    type="number"
                    value={formData.textConfig.fontSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          fontSize: parseInt(e.target.value) || 48,
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Font Rangi</label>
                  <input
                    type="color"
                    value={formData.textConfig.fontColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          fontColor: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>X Pozitsiya</label>
                    <input
                      type="number"
                      value={formData.textConfig.x}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          textConfig: {
                            ...formData.textConfig,
                            x: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Y Pozitsiya</label>
                    <input
                      type="number"
                      value={formData.textConfig.y}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          textConfig: {
                            ...formData.textConfig,
                            y: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Matn Joylashuvi</label>
                  <select
                    value={formData.textConfig.align}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          align: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="left">Chapga</option>
                    <option value="center">Markazga</option>
                    <option value="right">O'ngga</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "1200px" }}
          >
            <div className="modal-header">
              <h2>⚙️ Matn Sozlamalari - {selectedTemplate?.name}</h2>
              <button className="close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                display: "grid",
                gridTemplateColumns: "400px 1fr",
                gap: "30px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
                  📐 Rasm O'lchami
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <div className="form-group">
                    <label>Kenglik (px)</label>
                    <input
                      type="number"
                      value={formData.width || selectedTemplate?.width || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, width: e.target.value })
                      }
                      placeholder={selectedTemplate?.width || "Auto"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Balandlik (px)</label>
                    <input
                      type="number"
                      value={formData.height || selectedTemplate?.height || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      placeholder={selectedTemplate?.height || "Auto"}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
                  ✍️ Matn Sozlamalari
                </h3>

                <div className="form-group">
                  <label>Font O'lchami (px)</label>
                  <input
                    type="number"
                    value={formData.textConfig.fontSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          fontSize: parseInt(e.target.value) || 48,
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Font Rangi</label>
                  <input
                    type="color"
                    value={formData.textConfig.fontColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          fontColor: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>X Pozitsiya</label>
                    <input
                      type="number"
                      value={formData.textConfig.x}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          textConfig: {
                            ...formData.textConfig,
                            x: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Y Pozitsiya</label>
                    <input
                      type="number"
                      value={formData.textConfig.y}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          textConfig: {
                            ...formData.textConfig,
                            y: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Matn Joylashuvi</label>
                  <select
                    value={formData.textConfig.align}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        textConfig: {
                          ...formData.textConfig,
                          align: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="left">Chapga</option>
                    <option value="center">Markazga</option>
                    <option value="right">O'ngga</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Test Matni</label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows="3"
                    placeholder="Preview uchun matn..."
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoPreview}
                      onChange={(e) => setAutoPreview(e.target.checked)}
                      style={{ width: "auto", margin: 0 }}
                    />
                    Auto-preview (real-time)
                  </label>
                  <small>Har o'zgarishda avtomatik preview yangilanadi</small>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "15px",
                    marginTop: "0",
                  }}
                >
                  👁️ Live Preview:
                </h3>
                {isGenerating && (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="spinner"></div>
                    <p>Generatsiya qilinmoqda...</p>
                  </div>
                )}
                {generatedImage && !isGenerating && (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={generatedImage}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        border: "2px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
                {!generatedImage && !isGenerating && (
                  <div
                    style={{
                      border: "2px dashed #E5E7EB",
                      borderRadius: "8px",
                      padding: "60px 20px",
                      textAlign: "center",
                      color: "#9CA3AF",
                    }}
                  >
                    <p>Preview paydo bo'ladi...</p>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleGenerate(false)}
                      style={{ marginTop: "10px" }}
                    >
                      🎨 Preview Yaratish
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateTextConfig}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="modal-header">
              <h2>👁️ Preview - {selectedTemplate?.name}</h2>
              <button
                className="close"
                onClick={() => setShowPreviewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Matn kiriting</label>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows="4"
                  placeholder="Bu yerga matn kiriting..."
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={handleGenerate}
              >
                🎨 Rasm Yaratish
              </button>

              {generatedImage && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <h3 style={{ fontSize: "18px" }}>Natija:</h3>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{
                      maxWidth: "100%",
                      border: "2px solid #E5E7EB",
                      borderRadius: "8px",
                      marginTop: "10px",
                    }}
                  />
                  <a
                    href={generatedImage}
                    download
                    className="btn btn-success"
                    style={{ marginTop: "10px" }}
                  >
                    ⬇️ Yuklab Olish
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Certificates;
