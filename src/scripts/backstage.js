(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // Stats Elements
    const checkedInEl = document.getElementById('checked-in-counter');
    const remainingEl = document.getElementById('remaining-counter');

    // Search and Filtering Logic variables
    const searchInput = document.getElementById('guest-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.guest-card');
    let currentFilter = 'all'; // all, expected, checked-in, needs-approval

    // Evaluate filters dynamically based on current DOM state
    function applyFilters() {
      const term = searchInput ? searchInput.value.toLowerCase() : '';
      
      cards.forEach(card => {
        const matchesSearch = card.getAttribute('data-search').includes(term);
        let matchesType = true;
        
        const hasCheckedIn = card.querySelectorAll('.checkin-toggle[data-status="true"]').length > 0;
        const hasRemainingExpected = card.querySelectorAll('.checkin-toggle[data-status="false"]').length > 0;
        const isNeedsApproval = card.classList.contains('guest-card-needs-approval');
        
        if (currentFilter === 'expected') {
          matchesType = hasRemainingExpected;
        } else if (currentFilter === 'checked-in') {
          matchesType = hasCheckedIn;
        } else if (currentFilter === 'needs-approval') {
          matchesType = isNeedsApproval;
        }

        card.style.display = (matchesSearch && matchesType) ? 'flex' : 'none';
      });
    }

    // Helper to show/hide the "Check In All" button dynamically
    const updateCardState = (card) => {
      const checkInAllBtn = card.querySelector('.check-in-all-btn');
      if (!checkInAllBtn) return;
      
      const pendingToggles = Array.from(card.querySelectorAll('.checkin-toggle[data-status="false"]'))
        .filter(t => !t.closest('.opacity-50'));
        
      if (pendingToggles.length === 0) {
        checkInAllBtn.style.display = 'none';
      } else {
        checkInAllBtn.style.display = 'block';
      }
    };

    // Initialize state for all cards on load
    cards.forEach(card => updateCardState(card));

    // Helper to adjust the global counters
    const adjustCounters = (isCheckingIn) => {
      if (!checkedInEl || !remainingEl) return;
      let currentCheckedIn = parseInt(checkedInEl.innerText);
      let currentRemaining = parseInt(remainingEl.innerText);
      
      if (isCheckingIn) {
        checkedInEl.innerText = currentCheckedIn + 1;
        remainingEl.innerText = currentRemaining - 1;
      } else {
        checkedInEl.innerText = currentCheckedIn - 1;
        remainingEl.innerText = currentRemaining + 1;
      }
    };

    // Check-In API Call
    const toggleCheckIn = async (btn) => {
      if (btn.disabled) return;
      btn.disabled = true;

      const guestId = btn.getAttribute('data-id');
      const target = btn.getAttribute('data-target');
      const currentStatus = btn.getAttribute('data-status') === 'true';
      const newStatus = !currentStatus;
      
      const timeSpan = btn.previousElementSibling?.querySelector('.checkin-time');

      // Optimistic UI Update
      btn.setAttribute('data-status', newStatus.toString());
      btn.innerText = newStatus ? 'Undo' : 'Check In';
      if (!newStatus && timeSpan) timeSpan.innerText = ''; // Clear time optimisticly 
      
      const card = btn.closest('.guest-card');
      updateCardState(card);
      adjustCounters(newStatus);
      applyFilters(); // Re-evaluate view state

      try {
        const res = await fetch('/api/backstage/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId, target, status: newStatus })
        });
        
        if (!res.ok) throw new Error('API failed');
        
        const resData = await res.json();
        
        // Populate timestamp if checked in
        if (newStatus && timeSpan && resData.formattedTime) {
            timeSpan.innerText = resData.formattedTime;
        }
      } catch (e) {
        // Revert on failure
        alert('Failed to update check-in status. Check your connection.');
        btn.setAttribute('data-status', currentStatus.toString());
        btn.innerText = currentStatus ? 'Undo' : 'Check In';
        if (timeSpan) timeSpan.innerText = '';
        updateCardState(card);
        adjustCounters(currentStatus);
        applyFilters(); 
      } finally {
        btn.disabled = false;
      }
    };

    // Attach individual toggle events
    document.querySelectorAll('.checkin-toggle').forEach(btn => {
      btn.addEventListener('click', () => toggleCheckIn(btn));
    });

    // Attach "Check In All" events
    document.querySelectorAll('.check-in-all-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const card = e.target.closest('.guest-card');
        
        // Filter out buttons belonging to guests who RSVP'd No/Pending (they have opacity-50)
        const toggles = Array.from(card.querySelectorAll('.checkin-toggle[data-status="false"]'))
          .filter(t => !t.closest('.opacity-50'));
        
        if (toggles.length === 0) return;

        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = 'Checking In...';

        // Process sequentially
        for (const t of toggles) {
          await toggleCheckIn(t);
        }
        
        // Reset button state in the background (it will be hidden by updateCardState anyway)
        btn.innerText = originalText;
        btn.disabled = false;
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => {
          b.classList.remove('bg-pink-600', 'text-white');
          b.classList.add('bg-zinc-900', 'text-zinc-300');
        });
        
        const activeBtn = e.target;
        activeBtn.classList.remove('bg-zinc-900', 'text-zinc-300');
        activeBtn.classList.add('bg-pink-600', 'text-white');
        
        currentFilter = activeBtn.getAttribute('data-filter');
        applyFilters();
      });
    });
  });
})();