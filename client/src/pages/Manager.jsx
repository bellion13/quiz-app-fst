import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings,
  Home as HomeIcon,
  Plus,
  Upload,
  Download,
  Pencil,
  Trash2,
  X,
  Lightbulb,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  exportQuestions,
  getToken,
  removeToken,
  verifyToken,
} from '../utils/api';
import Loading from '../components/Loading';

const TOPICS = [
  { value: 'all', label: 'Tất cả chủ đề' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'js', label: 'JavaScript' },
  { value: 'react', label: 'React' },
];

function Manager() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [notification, setNotification] = useState(null);

  // Form Modal State (Thêm / Sửa)
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    topic: 'html',
    question: '',
    options: ['', '', '', ''],
    answer: 0,
    explanation: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState('merge');
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Kiểm tra token khi mount (bao gồm kiểm tra token hết hạn/sai với server)
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      if (!getToken()) {
        navigate('/login');
        return;
      }
      const isValid = await verifyToken();
      if (!cancelled && !isValid) {
        navigate('/login?expired=1');
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({
      topic: 'html',
      question: '',
      options: ['', '', '', ''],
      answer: 0,
      explanation: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  // Mở modal sửa câu hỏi
  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      topic: q.topic,
      question: q.question,
      options: [...q.options],
      answer: q.answer,
      explanation: q.explanation || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  // Thay đổi options trong form
  const handleOptionChange = (index, value) => {
    const updated = [...formData.options];
    updated[index] = value;
    setFormData({ ...formData, options: updated });
  };

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      setFormError('Câu hỏi phải có ít nhất 2 đáp án lựa chọn.');
      return;
    }
    const updated = formData.options.filter((_, i) => i !== index);
    let newAnswer = formData.answer;
    if (newAnswer >= updated.length) newAnswer = 0;
    setFormData({ ...formData, options: updated, answer: newAnswer });
  };

  // Lưu câu hỏi (Thêm hoặc Sửa)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validate nhanh client-side
    if (!formData.question.trim()) {
      setFormError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const filteredOptions = formData.options.map((o) => o.trim());
    if (filteredOptions.some((o) => !o)) {
      setFormError('Tất cả các lựa chọn đáp án không được để trống.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        question: formData.question.trim(),
        options: filteredOptions,
      };

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, payload);
        setNotification({ type: 'success', message: 'Cập nhật câu hỏi thành công!' });
      } else {
        await createQuestion(payload);
        setNotification({ type: 'success', message: 'Thêm câu hỏi mới thành công!' });
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Xoá câu hỏi
  const handleDelete = async (id, questionText) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xoá câu hỏi:\n"${questionText}"?`);
    if (!confirmed) return;

    try {
      await deleteQuestion(id);
      setNotification({ type: 'success', message: 'Đã xoá câu hỏi thành công.' });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Export JSON
  const handleExport = async () => {
    try {
      const data = await exportQuestions();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `quiz_questions_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setNotification({ type: 'success', message: 'Đã xuất file JSON thành công!' });
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Xử lý chọn file JSON import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImportError(null);
    if (!file) {
      setImportFile(null);
      setImportData(null);
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) {
          setImportError('File JSON phải chứa một mảng danh sách câu hỏi [...]');
          setImportData(null);
          return;
        }
        setImportData(parsed);
      } catch (err) {
        setImportError('File không phải định dạng JSON hợp lệ: ' + err.message);
        setImportData(null);
      }
    };
    reader.readAsText(file);
  };

  // Thực hiện Import
  const handleExecuteImport = async () => {
    if (!importData || importData.length === 0) {
      setImportError('Vui lòng chọn file JSON hợp lệ có dữ liệu.');
      return;
    }

    if (importMode === 'replace') {
      const confirmReplace = window.confirm(
        '⚠️ BẠN CÓ CHẮC CHẮN MUỐN XOÁ TOÀN BỘ CÂU HỎI CŨ VÀ THAY BẰNG BỘ MỚI KHÔNG?\nThao tác này không thể hoàn tác!'
      );
      if (!confirmReplace) return;
    }

    try {
      setImportLoading(true);
      setImportError(null);
      const res = await importQuestions(importMode, importData);
      setNotification({ type: 'success', message: res.message });
      setShowImportModal(false);
      setImportFile(null);
      setImportData(null);
      await loadData();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Lọc câu hỏi theo topic
  const filteredQuestions = selectedTopic === 'all'
    ? questions
    : questions.filter((q) => q.topic === selectedTopic);

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h2 className="inline-icon">
            <Settings size={24} /> Quản lý ngân hàng câu hỏi
          </h2>
          <p className="subtitle">Thêm, sửa, xoá và sao lưu câu hỏi cho ứng dụng</p>
        </div>
        <div className="manager-actions">
          <Link to="/" className="btn btn-outline inline-icon">
            <HomeIcon size={16} /> Về làm quiz
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary inline-icon">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Thông báo */}
      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} aria-label="Đóng thông báo">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="manager-toolbar card">
        <div className="toolbar-left">
          <button className="btn btn-primary inline-icon" onClick={handleOpenAdd}>
            <Plus size={16} /> Thêm câu hỏi
          </button>
          <button className="btn btn-outline inline-icon" onClick={() => setShowImportModal(true)}>
            <Upload size={16} /> Import JSON
          </button>
          <button className="btn btn-outline inline-icon" onClick={handleExport}>
            <Download size={16} /> Export JSON
          </button>
        </div>

        <div className="toolbar-right">
          <label>Lọc chủ đề: </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="topic-filter-select"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} ({t.value === 'all' ? questions.length : questions.filter(q => q.topic === t.value).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng câu hỏi */}
      {loading ? (
        <Loading />
      ) : filteredQuestions.length === 0 ? (
        <div className="card empty-state">
          <h3>Chưa có câu hỏi nào trong mục này.</h3>
          <p>Bấm "Thêm câu hỏi" hoặc "Import JSON" để đưa câu hỏi vào.</p>
        </div>
      ) : (
        <div className="card table-responsive">
          <table className="question-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '90px' }}>Chủ đề</th>
                <th>Câu hỏi</th>
                <th style={{ width: '120px' }}>Đáp án đúng</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td><strong>#{q.id}</strong></td>
                  <td>
                    <span className={`badge badge-${q.topic}`}>
                      {q.topic.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="table-question-title">{q.question}</div>
                    {q.explanation && (
                      <div className="table-explanation inline-icon-start">
                        <Lightbulb size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge-answer">
                      {q.options[q.answer] || `Đáp án #${q.answer + 1}`}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions">
                      <button
                        className="btn-sm btn-edit inline-icon"
                        onClick={() => handleOpenEdit(q)}
                      >
                        <Pencil size={14} /> Sửa
                      </button>
                      <button
                        className="btn-sm btn-delete inline-icon"
                        onClick={() => handleDelete(q.id, q.question)}
                      >
                        <Trash2 size={14} /> Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL THÊM / SỬA CÂU HỎI */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="inline-icon">
                {editingQuestion ? (
                  <>
                    <Pencil size={18} /> Chỉnh sửa câu hỏi
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Thêm câu hỏi mới
                  </>
                )}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            {formError && <div className="error-alert">{formError}</div>}

            <form onSubmit={handleSaveQuestion}>
              <div className="form-group">
                <label>Chủ đề</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                >
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="js">JavaScript</option>
                  <option value="react">React</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nội dung câu hỏi</label>
                <textarea
                  rows="3"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Các lựa chọn đáp án (chọn radio để đánh dấu đáp án đúng)</label>
                <div className="options-edit-list">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="option-edit-row">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.answer === idx}
                        onChange={() => setFormData({ ...formData, answer: idx })}
                        title="Chọn làm đáp án đúng"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Đáp án ${idx + 1}`}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          className="btn-icon-delete"
                          onClick={() => handleRemoveOption(idx)}
                          title="Xoá đáp án này"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '8px' }}
                  onClick={handleAddOption}
                >
                  + Thêm đáp án lựa chọn
                </button>
              </div>

              <div className="form-group">
                <label>Giải thích chi tiết (tùy chọn)</label>
                <textarea
                  rows="2"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Giải thích vì sao đáp án này đúng..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT JSON */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="inline-icon">
                <Upload size={18} /> Import câu hỏi từ file JSON
              </h3>
              <button className="btn-close" onClick={() => setShowImportModal(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            {importError && <div className="error-alert">{importError}</div>}

            <div className="form-group">
              <label>1. Chọn file JSON từ máy tính</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
              />
              {importData && (
                <p className="helper-text success-text inline-icon">
                  <CheckCircle2 size={16} /> Đã nhận diện được <strong>{importData.length}</strong> câu hỏi trong file.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>2. Chế độ Import</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />
                  <div>
                    <strong>Thêm vào (Gộp)</strong>
                    <div className="helper-text">Giữ nguyên các câu hỏi cũ, thêm các câu mới, tự động bỏ qua nếu câu hỏi bị trùng.</div>
                  </div>
                </label>

                <label className="radio-label warning-box">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <div>
                    <strong style={{ color: '#c0392b' }}>Thay thế (Xoá bộ cũ)</strong>
                    <div className="helper-text">Xoá toàn bộ ngân hàng câu hỏi hiện tại và thay thế hoàn toàn bằng bộ câu hỏi từ file này.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowImportModal(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className={`btn ${importMode === 'replace' ? 'btn-secondary' : 'btn-primary'}`}
                disabled={!importData || importLoading}
                onClick={handleExecuteImport}
              >
                {importLoading ? 'Đang xử lý...' : (importMode === 'replace' ? 'Thay thế toàn bộ' : 'Import câu hỏi')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manager;
