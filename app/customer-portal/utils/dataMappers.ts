/**
 * Data Mappers
 * Transform ServiceTitan API responses into section-friendly formats
 */

/**
 * Map appointments to expected format
 * Build explicit shape - UI needs: id, jobType, start, status, location, notes, completedDate, summary
 */
export function mapAppointments(appointments: any[] = []) {
  return appointments.map((apt) => {
    // Normalize location to string - prefer formatted/name fields first
    let location = '';
    if (typeof apt.location === 'string') {
      location = apt.location;
    } else if (apt.serviceLocation?.formattedAddress) {
      location = apt.serviceLocation.formattedAddress;
    } else if (apt.serviceLocation?.name) {
      location = apt.serviceLocation.name;
    } else if (apt.serviceLocation?.address) {
      const addr = apt.serviceLocation.address;
      if (typeof addr === 'string') {
        location = addr;
      } else {
        const parts = [addr.street, addr.city, addr.state, addr.zip]
          .map(p => p?.trim())
          .filter(p => p && p.length > 0);
        location = parts.join(', ');
      }
    } else if (apt.address) {
      const addr = apt.address;
      if (typeof addr === 'string') {
        location = addr.trim();
      } else {
        const parts = [addr.street, addr.city, addr.state, addr.zip]
          .map(p => p?.trim())
          .filter(p => p && p.length > 0);
        location = parts.join(', ');
      }
    }

    return {
      id: apt.id || apt.appointmentId,
      jobType: apt.jobType || apt.businessUnit?.name || 'Service Call',
      start: apt.start || apt.scheduledOn || apt.scheduledDate,
      status: apt.status || apt.jobStatus || apt.appointmentStatus || 'Scheduled',
      location: location || 'Location TBD',
      notes: apt.notes || apt.customerNotes,
      completedDate: apt.completedDate || apt.completedOn,
      summary: apt.summary || apt.description,
    };
  });
}

/**
 * Map invoices to expected format
 * Build explicit shape - UI needs: id, number, status, balance, date, summary, dueDate, total, paidDate
 */
export function mapInvoices(invoices: any[] = []) {
  return invoices.map((inv) => {
    const balance = typeof inv.balance === 'number' ? inv.balance : (inv.balanceDue || inv.total || 0);
    
    return {
      id: inv.id || inv.invoiceId,
      number: inv.number || inv.invoiceNumber || inv.id,
      status: inv.status || inv.documentStatus || (balance === 0 ? 'Paid' : 'Open'),
      balance,
      date: inv.date || inv.invoiceDate || inv.createdDate,
      summary: inv.summary || inv.description || `Invoice #${inv.number || inv.id}`,
      dueDate: inv.dueDate || inv.invoiceDueDate,
      total: inv.total || inv.totalAmount || balance,
      paidDate: inv.paidDate || inv.paymentDate,
    };
  });
}

/**
 * Map estimates to expected format
 * Build explicit shape - UI needs: id, name, status, total, summary
 */
export function mapEstimates(estimates: any[] = []) {
  return estimates.map((est) => ({
    id: est.id || est.estimateId || est.estimateNumber,
    name: est.name || est.jobName || 'Service Estimate',
    status: est.status || est.estimateStatus || 'Open',
    total: est.total || est.totalAmount,
    summary: est.summary || est.description || `Estimate #${est.estimateNumber || est.id}`,
  }));
}

/**
 * Map jobs/history to expected format
 * Build explicit shape - UI needs: id, jobType, completedDate, createdDate, invoice, summary, technician
 */
export function mapJobs(jobs: any[] = []) {
  return jobs.map((job) => {
    // Normalize technician to string - try multiple field variations
    let technician = '';
    if (typeof job.technician === 'string') {
      technician = job.technician;
    } else if (job.technician?.name) {
      technician = job.technician.name;
    } else if (job.technician?.displayName) {
      technician = job.technician.displayName;
    } else if (job.assignedTechnician?.name) {
      technician = job.assignedTechnician.name;
    } else if (job.assignedTechnician?.displayName) {
      technician = job.assignedTechnician.displayName;
    } else if (job.technicianName) {
      technician = job.technicianName;
    }

    // Normalize invoice object if it exists
    let invoice = null;
    if (job.invoice) {
      invoice = {
        total: job.invoice.total || job.invoice.totalAmount || 0,
      };
    }

    return {
      id: job.id || job.jobId,
      jobType: job.jobType || job.businessUnit?.name || 'Service Call',
      completedDate: job.completedDate || job.completedOn,
      createdDate: job.createdDate || job.createdOn,
      invoice,
      summary: job.summary || job.description,
      technician: technician || 'Technician pending',
    };
  });
}

/**
 * Map individual membership to expected format
 * Build explicit shape - UI needs: id, membershipTypeName, status, from, to, benefits
 */
export function mapMembership(membership: any) {
  return {
    id: membership.id || membership.membershipId,
    membershipTypeName: membership.membershipTypeName || membership.name || 'Membership',
    status: membership.status || (membership.isActive ? 'Active' : 'Inactive'),
    from: membership.from || membership.startDate,
    to: membership.to || membership.endDate || membership.expirationDate,
    benefits: membership.benefits || { discounts: [], recurringServices: [] },
  };
}

/**
 * Map individual voucher to expected format
 * Build explicit shape - UI needs: id, status, expiresAt, discountAmount, voucherType, code, minimumJobAmount, redeemedAt, redeemedJobNumber, qrCode
 */
export function mapVoucher(voucher: any) {
  return {
    id: voucher.id || voucher.voucherId,
    status: voucher.status || (voucher.isActive ? 'active' : 'inactive'),
    expiresAt: voucher.expiresAt || voucher.expirationDate || voucher.expiresOn,
    discountAmount: voucher.discountAmount || voucher.amount || voucher.value || 0,
    voucherType: voucher.voucherType || voucher.type || 'standard',
    code: voucher.code || voucher.voucherCode,
    minimumJobAmount: voucher.minimumJobAmount || voucher.minimumAmount || 0,
    redeemedAt: voucher.redeemedAt || voucher.redeemedDate,
    redeemedJobNumber: voucher.redeemedJobNumber || voucher.jobNumber,
    qrCode: voucher.qrCode || voucher.qrCodeUrl,
  };
}

/**
 * Aggregate memberships for dashboard
 */
export function mapMemberships(memberships: any[] = []) {
  const active = memberships.filter((m) => 
    m.status === 'Active' || m.status === 'active' || m.isActive
  );
  
  return {
    activeCount: active.length,
    nextRenewalDate: active[0]?.nextBillingDate || active[0]?.renewalDate,
    totalValue: active.reduce((sum, m) => sum + (m.recurringCharge || m.totalValue || 0), 0),
  };
}

/**
 * Aggregate vouchers for dashboard
 */
export function mapVouchers(vouchers: any[] = []) {
  const active = vouchers.filter((v) => 
    v.status === 'active' || v.status === 'Active' || v.isActive
  );
  
  return {
    activeCount: active.length,
    totalValue: active.reduce((sum, v) => sum + (v.discountAmount || v.amount || v.value || 0), 0),
    nearestExpiry: active.reduce((nearest: string | null, v) => {
      const expiry = v.expiresOn || v.expirationDate || v.expiry;
      if (!expiry) return nearest;
      if (!nearest) return expiry;
      return new Date(expiry) < new Date(nearest) ? expiry : nearest;
    }, null),
  };
}

/**
 * Map contacts to expected format
 * Build explicit shape to prevent nested object leakage
 */
export function mapContacts(contacts: any[] = []) {
  return contacts.map((contact) => {
    const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    
    return {
      id: contact.id || contact.contactId,
      name: name || 'Contact',
      phone: contact.phone || contact.phoneNumber || contact.mobilePhone || '',
      email: contact.email || contact.emailAddress || '',
      type: contact.type || contact.contactType || 'primary',
      isPrimary: contact.isPrimary || contact.primary || false,
    };
  });
}

/**
 * Map locations to expected format
 * Build explicit shape to prevent nested object leakage
 */
export function mapLocations(locations: any[] = []) {
  return locations.map((loc) => {
    // Normalize address to string
    let address = '';
    let city = '';
    let state = '';
    let zip = '';

    if (typeof loc.address === 'string') {
      address = loc.address.trim();
      city = loc.city || '';
      state = loc.state || '';
      zip = loc.zip || loc.zipCode || '';
    } else if (loc.address && typeof loc.address === 'object') {
      const parts = [loc.address.street, loc.address.city, loc.address.state, loc.address.zip]
        .map(p => p?.trim())
        .filter(p => p && p.length > 0);
      address = parts.join(', ');
      city = loc.address.city || loc.city || '';
      state = loc.address.state || loc.state || '';
      zip = loc.address.zip || loc.zip || loc.zipCode || '';
    } else if (loc.serviceAddress) {
      const parts = [loc.serviceAddress.street, loc.serviceAddress.city, loc.serviceAddress.state, loc.serviceAddress.zip]
        .map(p => p?.trim())
        .filter(p => p && p.length > 0);
      address = parts.join(', ');
      city = loc.serviceAddress.city || loc.city || '';
      state = loc.serviceAddress.state || loc.state || '';
      zip = loc.serviceAddress.zip || loc.zip || loc.zipCode || '';
    } else if (loc.street) {
      const parts = [loc.street, loc.city, loc.state, loc.zip]
        .map(p => p?.trim())
        .filter(p => p && p.length > 0);
      address = parts.join(', ');
      city = loc.city || '';
      state = loc.state || '';
      zip = loc.zip || loc.zipCode || '';
    }

    // Build explicit shape - no spreading to prevent object leakage
    return {
      id: loc.id || loc.locationId,
      name: loc.name || loc.locationName,
      address: address || 'Location TBD',
      city: city,
      state: state,
      zip: zip,
      type: loc.type || loc.locationType || 'residential',
      isPrimary: loc.isPrimary || loc.primary || false,
    };
  });
}

/**
 * Transform complete customer data for portal sections
 * Build explicit shape to prevent ANY object leakage
 */
export function transformCustomerData(customerData: any) {
  if (!customerData) return null;

  // Build explicit shape - no spreading to prevent object leakage
  return {
    // Core customer info (primitives only)
    id: customerData.id || customerData.customerId,
    name: customerData.name || `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
    email: customerData.email || '',
    phone: customerData.phone || '',
    
    // Sanitized mapped data (all primitives/curated shapes)
    appointments: mapAppointments(customerData.appointments || []),
    invoices: mapInvoices(customerData.invoices || []),
    estimates: mapEstimates(customerData.estimates || []),
    jobs: mapJobs(customerData.jobs || customerData.jobHistory || []),
    memberships: (customerData.memberships || []).map(mapMembership),
    vouchers: (customerData.vouchers || []).map(mapVoucher),
    contacts: mapContacts(customerData.contacts || []),
    locations: mapLocations(customerData.locations || []),
  };
}
