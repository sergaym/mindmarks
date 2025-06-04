'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType, User } from '@/types/content';
import { contentTemplates, getTemplateByType } from '@/lib/content-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, ArrowLeft, Plus, ExternalLink, Search, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

