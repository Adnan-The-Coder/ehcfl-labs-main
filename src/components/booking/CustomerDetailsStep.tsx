import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { Customer } from '@/pages/Booking';

interface Props {
  customers: Customer[];
  onUpdate: (customers: Customer[]) => void;
  onNext: () => void;
}

const CustomerDetailsStep = ({ customers, onUpdate, onNext }: Props) => {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(
    customers.length > 0 ? customers : [{ name: '', age: '', gender: '', phone: '', email: '' }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addCustomer = () => {
    setLocalCustomers([...localCustomers, { name: '', age: '', gender: '', phone: '', email: '' }]);
  };

  const removeCustomer = (index: number) => {
    if (localCustomers.length > 1) {
      setLocalCustomers(localCustomers.filter((_, i) => i !== index));
    }
  };

  const updateCustomer = (index: number, field: keyof Customer, value: string) => {
    const updated = [...localCustomers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalCustomers(updated);
    // Clear error for this field
    setErrors({ ...errors, [`${index}-${field}`]: '' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    localCustomers.forEach((customer, index) => {
      if (!customer.name.trim()) {
        newErrors[`${index}-name`] = 'Name is required';
      }
      if (!customer.age || parseInt(customer.age) < 1 || parseInt(customer.age) > 120) {
        newErrors[`${index}-age`] = 'Valid age (1-120) required';
      }
      if (!customer.gender) {
        newErrors[`${index}-gender`] = 'Gender is required';
      }
      if (!customer.phone || !/^\d{10}$/.test(customer.phone)) {
        newErrors[`${index}-phone`] = 'Valid 10-digit phone required';
      }
      if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
        newErrors[`${index}-email`] = 'Valid email required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(localCustomers);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customer Details</h2>
        <p className="text-muted-foreground">Who is this booking for?</p>
      </div>

      {localCustomers.map((customer, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4 relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Patient {index + 1}</h3>
            {localCustomers.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCustomer(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`name-${index}`}>Full Name *</Label>
              <Input
                id={`name-${index}`}
                value={customer.name}
                onChange={(e) => updateCustomer(index, 'name', e.target.value)}
                placeholder="Enter full name"
                className={errors[`${index}-name`] ? 'border-destructive' : ''}
              />
              {errors[`${index}-name`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-name`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`age-${index}`}>Age *</Label>
              <Input
                id={`age-${index}`}
                type="number"
                value={customer.age}
                onChange={(e) => updateCustomer(index, 'age', e.target.value)}
                placeholder="Enter age"
                min="1"
                max="120"
                className={errors[`${index}-age`] ? 'border-destructive' : ''}
              />
              {errors[`${index}-age`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-age`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`gender-${index}`}>Gender *</Label>
              <Select
                value={customer.gender}
                onValueChange={(value) => updateCustomer(index, 'gender', value)}
              >
                <SelectTrigger className={errors[`${index}-gender`] ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors[`${index}-gender`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-gender`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`phone-${index}`}>Phone Number *</Label>
              <Input
                id={`phone-${index}`}
                type="tel"
                value={customer.phone}
                onChange={(e) => updateCustomer(index, 'phone', e.target.value)}
                placeholder="10-digit number"
                maxLength={10}
                className={errors[`${index}-phone`] ? 'border-destructive' : ''}
              />
              {errors[`${index}-phone`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-phone`]}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
              <Input
                id={`email-${index}`}
                type="email"
                value={customer.email}
                onChange={(e) => updateCustomer(index, 'email', e.target.value)}
                placeholder="Enter email"
                className={errors[`${index}-email`] ? 'border-destructive' : ''}
              />
              {errors[`${index}-email`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-email`]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addCustomer} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Another Person
      </Button>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CustomerDetailsStep;
