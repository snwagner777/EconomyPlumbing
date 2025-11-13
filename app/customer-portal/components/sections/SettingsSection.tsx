/**
 * Settings Section - Account Settings and Preferences
 * Accordion sections for Contacts, Locations, and Preferences
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Settings as SettingsIcon,
  Edit2,
  Trash2,
  Plus,
  Home,
  Building2
} from "lucide-react";

interface SettingsSectionProps {
  customerData?: any;
  onEditContacts?: () => void;
  onAddLocation?: () => void;
  onEditLocation?: (location: any) => void;
  formatPhoneNumber?: (phone: string) => string;
}

export function SettingsSection({
  customerData,
  onEditContacts,
  onAddLocation,
  onEditLocation,
  formatPhoneNumber,
}: SettingsSectionProps) {
  const [activeSection, setActiveSection] = useState<string>('contacts');

  // Extract data with null safety
  const contacts = (customerData?.contacts || []).filter((c: any) => c && (c.name || c.phone || c.email));
  const locations = (customerData?.locations || []).filter((l: any) => l && (l.address || l.street));
  const primaryContact = contacts.find((c: any) => c.isPrimary) || contacts[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your contact information, locations, and preferences
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible value={activeSection} onValueChange={setActiveSection}>
        {/* Contacts Section */}
        <AccordionItem value="contacts" data-testid="accordion-contacts">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">Contact Information</span>
              {contacts.length > 0 && (
                <Badge variant="secondary">{contacts.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {contacts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-6">
                      <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Contact Information</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your phone number and email to receive updates.
                      </p>
                      {onEditContacts && (
                        <Button onClick={onEditContacts} data-testid="button-add-first-contact">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contact Info
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {primaryContact && (
                    <Card data-testid="card-primary-contact">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">Primary Contact</CardTitle>
                            {primaryContact.name && (
                              <CardDescription>{primaryContact.name}</CardDescription>
                            )}
                          </div>
                          {onEditContacts && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onEditContacts}
                              data-testid="button-edit-primary-contact"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {primaryContact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{formatPhoneNumber ? formatPhoneNumber(primaryContact.phone) : primaryContact.phone}</span>
                          </div>
                        )}
                        {primaryContact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{primaryContact.email}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {contacts.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Additional Contacts ({contacts.length - 1})
                      </h4>
                      {contacts.filter((c: any) => !c.isPrimary).map((contact: any, index: number) => (
                        <Card key={contact.id || index} data-testid={`card-contact-${contact.id || index}`}>
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                {contact.name && (
                                  <p className="text-sm font-medium">{contact.name}</p>
                                )}
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {contact.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {formatPhoneNumber ? formatPhoneNumber(contact.phone) : contact.phone}
                                    </span>
                                  )}
                                  {contact.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {onEditContacts && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={onEditContacts}
                                  data-testid={`button-edit-contact-${contact.id || index}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Locations Section */}
        <AccordionItem value="locations" data-testid="accordion-locations">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">Service Locations</span>
              {locations.length > 0 && (
                <Badge variant="secondary">{locations.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {locations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-6">
                      <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Service Locations</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a location where you need service.
                      </p>
                      {onAddLocation && (
                        <Button onClick={onAddLocation} data-testid="button-add-first-location">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Location
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Manage addresses where you receive service
                    </p>
                    {onAddLocation && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddLocation}
                        data-testid="button-add-location"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Location
                      </Button>
                    )}
                  </div>
                  {locations.map((location: any, index: number) => (
                    <Card key={location.id || index} data-testid={`card-location-${location.id || index}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              {location.type === 'Commercial' ? (
                                <Building2 className="w-4 h-4 text-primary" />
                              ) : (
                                <Home className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {location.name || 'Service Location'}
                              </CardTitle>
                              {location.address && (
                                <CardDescription className="mt-1">
                                  {typeof location.address === 'string' ? location.address : (
                                    <>
                                      {location.address.street}<br />
                                      {location.address.city}, {location.address.state} {location.address.zip}
                                    </>
                                  )}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {onEditLocation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditLocation(location)}
                              data-testid={`button-edit-location-${location.id || index}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Preferences Section */}
        <AccordionItem value="preferences" data-testid="accordion-preferences">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              <span className="font-semibold">Preferences</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Communication Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive updates from us
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Email and notification preferences coming soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
