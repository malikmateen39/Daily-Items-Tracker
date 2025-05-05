document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const addItemForm = document.getElementById('addItemForm');
    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    const itemQuantityInput = document.getElementById('itemQuantity');
    const itemUnitSelect = document.getElementById('itemUnit');
    const clientNameInput = document.getElementById('clientName');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const emptyState = document.getElementById('emptyState');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const generateBillBtn = document.getElementById('generateBillBtn');
    const billCard = document.getElementById('billCard');
    const billDate = document.getElementById('billDate');
    const billItemsTableBody = document.getElementById('billItemsTableBody');
    const billTotal = document.getElementById('billTotal');
    const saveBillBtn = document.getElementById('saveBillBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const closeBillBtn = document.getElementById('closeBillBtn');
    const savedBillsList = document.getElementById('savedBillsList');
    const noSavedBills = document.getElementById('noSavedBills');
    const loading = document.getElementById('loading');
    
    // Summary Elements
    const totalItemsEl = document.getElementById('totalItems');
    const totalQuantityEl = document.getElementById('totalQuantity');
    const totalAmountEl = document.getElementById('totalAmount');
    
    // App State
    let items = [];
    let savedBills = JSON.parse(localStorage.getItem('savedBills')) || [];
    const darkModeEnabled = localStorage.getItem('darkMode') !== 'false';
    
    // Set initial theme
    if (!darkModeEnabled) {
      document.body.classList.add('light-mode');
    }
    
    // Theme Toggle
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('light-mode');
      const isDarkMode = !document.body.classList.contains('light-mode');
      localStorage.setItem('darkMode', isDarkMode);
    });
    
    // Add new item
    addItemForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = itemNameInput.value.trim();
      const price = parseFloat(itemPriceInput.value);
      const quantity = parseFloat(itemQuantityInput.value);
      const unit = itemUnitSelect.value;
      const clientName = clientNameInput.value.trim();
      
      if (name && price >= 0 && quantity > 0) {
        const newItem = {
          id: Date.now(),
          name,
          price,
          quantity,
          unit,
          total: price * quantity,
          clientName
        };
        
        items.push(newItem);
        resetForm();
        renderItems();
        updateSummary();
      }
    });
    
    // Reset form
    function resetForm() {
      itemNameInput.value = '';
      itemPriceInput.value = '';
      itemQuantityInput.value = '1';
      clientNameInput.value = '';
      itemNameInput.focus();
    }
    
    // Render items table
    function renderItems() {
      if (items.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('itemsTable').style.display = 'none';
        clearAllBtn.disabled = true;
        generateBillBtn.disabled = true;
        return;
      }
      
      emptyState.style.display = 'none';
      document.getElementById('itemsTable').style.display = 'table';
      clearAllBtn.disabled = false;
      generateBillBtn.disabled = false;
      
      itemsTableBody.innerHTML = '';
      
      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>RS${item.price.toFixed(2)}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>RS${item.total.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Remove</button>
          </td>
        `;
        itemsTableBody.appendChild(tr);
      });
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          items = items.filter(item => item.id !== id);
          renderItems();
          updateSummary();
        });
      });
    }
    
    // Update summary
    function updateSummary() {
      const totalItems = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      totalItemsEl.textContent = totalItems;
      totalQuantityEl.textContent = totalQuantity;
      totalAmountEl.textContent = `RS${totalAmount.toFixed(2)}`;
    }
    
    // Clear all items
    clearAllBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all items?')) {
        items = [];
        renderItems();
        updateSummary();
      }
    });
    
    // Generate bill
    generateBillBtn.addEventListener('click', function() {
      if (items.length === 0) return;
      
      const now = new Date();
      billDate.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
      
      billItemsTableBody.innerHTML = '';
      
      // Add client info if available
      const clientName = items[0].clientName;
      if (clientName) {
        const clientRow = document.createElement('tr');
        clientRow.innerHTML = `
          <td colspan="4" style="text-align: center; font-weight: bold; padding: 15px 0;">
            Client: ${clientName}
          </td>
        `;
        billItemsTableBody.appendChild(clientRow);
      }
      
      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>RS${item.price.toFixed(2)}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>RS${item.total.toFixed(2)}</td>
        `;
        billItemsTableBody.appendChild(tr);
      });
      
      const total = items.reduce((sum, item) => sum + item.total, 0);
      billTotal.textContent = `RS${total.toFixed(2)}`;
      
      billCard.style.display = 'block';
      billCard.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Save bill
    saveBillBtn.addEventListener('click', function() {
      const billData = {
        id: Date.now(),
        date: new Date().toISOString(),
        displayDate: billDate.textContent,
        items: [...items],
        total: items.reduce((sum, item) => sum + item.total, 0),
        clientName: items[0]?.clientName || ''
      };
      
      savedBills.push(billData);
      localStorage.setItem('savedBills', JSON.stringify(savedBills));
      
      showLoading();
      setTimeout(() => {
        hideLoading();
        renderSavedBills();
        items = [];
        renderItems();
        updateSummary();
        billCard.style.display = 'none';
        alert('Bill saved successfully!');
      }, 1000);
    });
    
    // Download PDF
    downloadPdfBtn.addEventListener('click', function() {
      showLoading();
      
      setTimeout(() => {
        try {
          const doc = new jsPDF();
          
          // Add title
          doc.setFontSize(22);
          doc.text('Invoice', 105, 20, { align: 'center' });
          
          // Add date
          doc.setFontSize(12);
          doc.text(`Date: ${billDate.textContent}`, 20, 30);
          
          // Add client info if available
          const clientName = items[0]?.clientName;
          if (clientName) {
            doc.text(`Client: ${clientName}`, 20, 40);
          }
          
          // Add items table
          doc.setFontSize(14);
          doc.text('Items:', 20, clientName ? 50 : 40);
          
          let yPos = clientName ? 60 : 50;
          
          // Table header
          doc.setFontSize(12);
          doc.text('Item', 20, yPos);
          doc.text('Price', 90, yPos);
          doc.text('Qty', 130, yPos);
          doc.text('Total', 160, yPos);
          yPos += 2;
          
          // Draw header underline
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
          
          // Table rows
          items.forEach(item => {
            doc.text(item.name, 20, yPos);
            doc.text(`RS${item.price.toFixed(2)}`, 90, yPos);
            doc.text(`${item.quantity} ${item.unit}`, 130, yPos);
            doc.text(`RS${item.total.toFixed(2)}`, 160, yPos);
            yPos += 10;
            
            // Add new page if needed
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
          });
          
          // Draw total line
          yPos += 5;
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
          
          // Add total
          doc.setFontSize(14);
          doc.text(`Total: RS${billTotal.textContent.replace('RS', '')}`, 160, yPos);
          
          // Save the PDF
          doc.save('bill.pdf');
          hideLoading();
        } catch (err) {
          console.error(err);
          hideLoading();
          alert('Error generating PDF. Please try again.');
        }
      }, 1000);
    });
    
    // Close bill preview
    closeBillBtn.addEventListener('click', function() {
      billCard.style.display = 'none';
    });
    
    // Show loading
    function showLoading() {
      loading.classList.add('active');
    }
    
    // Hide loading
    function hideLoading() {
      loading.classList.remove('active');
    }
    
    // Render saved bills
    function renderSavedBills() {
      if (savedBills.length === 0) {
        noSavedBills.style.display = 'block';
        return;
      }
      
      noSavedBills.style.display = 'none';
      savedBillsList.innerHTML = '';
      
      savedBills.forEach(bill => {
        const billItem = document.createElement('div');
        billItem.className = 'saved-bill-item fade-in';
        
        const formattedDate = new Date(bill.date).toLocaleDateString();
        const formattedTime = new Date(bill.date).toLocaleTimeString();
        
        billItem.innerHTML = `
          <div class="saved-bill-info">
            <div class="saved-bill-title">Bill #${bill.id.toString().slice(-4)}</div>
            <div class="saved-bill-date">${formattedDate} ${formattedTime}</div>
            <div>Total: RS${bill.total.toFixed(2)}</div>
            ${bill.clientName ? `<div>Client: ${bill.clientName}</div>` : ''}
          </div>
          <div class="saved-bill-actions">
            <button class="btn btn-sm view-bill-btn" data-id="${bill.id}">View</button>
            <button class="btn btn-sm btn-danger delete-bill-btn" data-id="${bill.id}">Delete</button>
          </div>
        `;
        
        savedBillsList.appendChild(billItem);
      });
      
      // Add event listeners to bill actions
      document.querySelectorAll('.view-bill-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          const bill = savedBills.find(b => b.id === id);
          
          if (bill) {
            items = [...bill.items];
            renderItems();
            updateSummary();
            generateBillBtn.click();
          }
        });
      });
      
      document.querySelectorAll('.delete-bill-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          
          if (confirm('Are you sure you want to delete this bill?')) {
            savedBills = savedBills.filter(b => b.id !== id);
            localStorage.setItem('savedBills', JSON.stringify(savedBills));
            renderSavedBills();
          }
        });
      });
    }
    
    // Initialize
    renderItems();
    updateSummary();
    renderSavedBills();
  });